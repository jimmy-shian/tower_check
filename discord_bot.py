import discord
import aiohttp
import re
import asyncio
from datetime import datetime
from discord.ext import commands

# 設定機器人所需權限
intents = discord.Intents.default()
intents.message_content = True  # 啟用讀取訊息內容的權限
intents.members = True  # 啟用成員相關權限,這樣才能發送私人訊息

# 建立 bot，並設定 application_id（請將下方的 "1331122986673115257" 替換成你自己的應用程式 ID）
bot = commands.Bot(command_prefix="!", intents=intents, application_id="1331122986673115257")

# Google Apps Script 的 Web App URL
WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx-EPvS6LW47CZksZ0GihuvHdlEahQiReSF1nzFCKh0QVbkW9Z-kTVhYg5i3APzd3mWXQ/exec"

# 指定要閱讀訊息的頻道 ID
TARGET_CHANNEL_IDS = {1085509216824999996, 1107524844700045345}  # 神魔頻道 & 個人頻道
BOT_LIKE_USER_ID = 639382101455667202  # 機器人類型的使用者 ID

# 建立一個 asyncio Queue 來管理查詢請求
query_queue = asyncio.Queue()


###############################################################################
# Slash Command 指令 1: /任務
# 此指令不接受參數，直接回傳當前月的任務資料。
###############################################################################
@bot.tree.command(name="任務", description="查詢當前月分的任務說明&獎勳")
async def task(interaction: discord.Interaction):
    await interaction.response.defer(ephemeral=True)
    print(f"查詢當前月分的任務說明&獎勳")

    async with aiohttp.ClientSession() as session:
        async with session.get(WEB_APP_URL) as response:
            if response.status != 200:
                await interaction.followup.send("無法獲取任務資料，請稍後再試。", ephemeral=True)
                return
            data = await response.json()
            if "mission" not in data:
                await interaction.followup.send("資料格式錯誤，請聯繫管理員。", ephemeral=True)
                return

            missions_text = []
            undefined_missions = []
            for mission in data["mission"]:
                if len(mission) >= 3:
                    mission_title = mission[1]
                    mission_desc = mission[2]
                    if not mission_title or not mission_desc:
                        undefined_missions.append(mission[0])
                    else:
                        # 確保任務內容的每一行都帶 `> ` 引用標註
                        formatted_desc = "\n".join([f"> {line}" for line in mission_desc.split("\n")])
                        missions_text.append(f"**任務 {mission[0]}: {mission_title}**\n{formatted_desc}")

            if undefined_missions:
                undefined_message = f"⚠️ 以下任務尚未訂定：任務{', '.join(map(str, undefined_missions))}"
                missions_text.append(undefined_message)

            reply_message = "以下是本月的任務:\n\n" + "\n\n".join(missions_text)
            await interaction.followup.send(reply_message, ephemeral=True)


###############################################################################
# Slash Command 指令 2: /查詢
# 此指令接受一個 uid 參數，回傳該 UID 當前月的查詢狀態
###############################################################################
@bot.tree.command(name="查詢", description="查詢 UID 任務完成度")
async def query(interaction: discord.Interaction, uid: str):
    await interaction.response.defer(ephemeral=True)
    current_month = datetime.now().month
    print(f"查詢 UID {uid} ，處理中")

    async with aiohttp.ClientSession() as session:
        async with session.post(WEB_APP_URL, data={"UID": uid, "month": current_month, "IP": "Discord_bot_command"}) as response:
            if response.status != 200:
                await interaction.followup.send(f"查詢失敗：UID {uid} 請稍後再試。", ephemeral=True)
                return
            try:
                data = await response.json()
            except Exception:
                await interaction.followup.send(f"發生錯誤：機器人錯誤 (UID: {uid})", ephemeral=True)
                return

            if "error" in data:
                await interaction.followup.send(f"錯誤：UID not found (UID: {uid})", ephemeral=True) #{data['error']}
                return

            second_row = data.get("secondRow", [])
            user_data = data.get("data", [])
            completed = []
            not_completed = []

            for i, (title, status) in enumerate(zip(second_row, user_data)):
                if i == 0:
                    continue
                if status == "T":
                    completed.append(title)
                elif status == "F":
                    not_completed.append(title)

            output = [f"UID: {user_data[0]}"]
            if len(not_completed) == 6:
                output.append("全部未完成")
            elif not_completed:
                output.append(f"任務 {','.join([task.replace('任務', '') for task in not_completed])} 未完成")
            else:
                output.append("全完成")

            formatted_output = [output[0]] + [f"> {line}" for line in output[1:]]
            await interaction.followup.send("\n".join(formatted_output), ephemeral=False)


###############################################################################
# 訊息事件監聽 & 查詢處理
###############################################################################
async def process_queries():
    while True:
        uid, message = await query_queue.get()
        try:
            # 當前月份
            current_month = datetime.now().month
            # print("UID", uid, "month", current_month)
            
            # 顯示「正在輸入」狀態
            async with message.channel.typing():
                # 使用 aiohttp 發送非同步的 POST 請求到 Google Apps Script
                async with aiohttp.ClientSession() as session:
                    async with session.post(WEB_APP_URL, data={"UID": uid, "month": current_month, "IP": "Discord_bot_message"}) as response:
                        # 檢查回應狀態碼
                        if response.status != 200:
                            await message.channel.send(f"查詢失敗：UID {uid} 請前往表單人工查詢，或稍後再試。")
                            continue
                        
                        # 確保解析 JSON
                        try:
                            data = await response.json()
                        except Exception as e:
                            await message.channel.send(f"發生錯誤：機器人壞掉了 (UID: {uid})")
                            continue

                        # 處理回應資料
                        if "error" in data:
                            if data["error"] == "UID not found or month data not available":
                                await message.channel.send(f"錯誤：UID not found (UID: {uid})")
                            else:
                                await message.channel.send(f"錯誤：{data['error']} (UID: {uid})")
                            continue

                        # 格式化並輸出回應
                        second_row = data.get("secondRow", [])
                        user_data = data.get("data", [])
                        completed = []
                        not_completed = []

                        for i, (title, status) in enumerate(zip(second_row, user_data)):
                            if i == 0:
                                continue
                            if status == "T":
                                completed.append(title)
                            elif status == "F":
                                not_completed.append(title)

                        output = [f"UID: {user_data[0]}"]
                        if len(not_completed) == 6:
                            output.append("全部未完成")
                        elif not_completed:
                            output.append(f"任務 {','.join([task.replace('任務', '') for task in not_completed])} 未完成")
                        else:
                            output.append("全完成")

                        formatted_output = [output[0]] + [f"> {line}" for line in output[1:]]
                        await message.channel.send("\n".join(formatted_output) + "\n")

        except Exception as e:
            await message.channel.send(f"發生錯誤：{str(e)} (UID: {uid})")
        finally:
            # 標記此任務已完成
            query_queue.task_done()


@bot.event
async def on_message(message):
    if message.author == bot.user or message.channel.id not in TARGET_CHANNEL_IDS:
        return

    uid_matches = re.findall(r"查[詢|询\s:：]*([0-9]+)", message.content)
    if uid_matches:
        for uid in uid_matches:
            await query_queue.put((uid, message))
            print(f"已將 UID {uid} 加入隊列處理")
    else:
        # 檢查是否有任何 5 位數以上的數字，如果有則提示格式錯誤
        contains_numbers = re.search(r"\d{5,}", message.content)
        if contains_numbers:
            await message.channel.send(f'請確認輸入格式，( "查詢XXXX" 或使用 "/查詢" 指令進行搜尋 )')

# ===== 刪除原本在全域位置建立背景任務的程式碼 =====
# bot.loop.create_task(process_queries())
# ======================================================

###############################################################################
# 非同步初始化：利用 setup_hook 建立背景任務
###############################################################################
async def setup_background_tasks():
    asyncio.create_task(process_queries())
bot.setup_hook = setup_background_tasks  # 將 setup_hook 指向上面的非同步初始化函式

###############################################################################
# 啟動機器
###############################################################################
@bot.event
async def on_ready():
    await bot.tree.sync()
    print(f"目前登入身份 --> {bot.user}")

bot.run()
