import discord
import aiohttp
import re
import asyncio
from datetime import datetime
from discord.ext import commands
import time
from discord.ui import Select, View

# 設定機器人所需權限
intents = discord.Intents.default()
intents.message_content = True  # 啟用讀取訊息內容的權限
intents.members = True  # 啟用成員相關權限, 這樣才能發送私人訊息

# 建立 bot，並設定 application_id（請將下方的 "1331122986673115257" 替換成你自己的應用程式 ID）
bot = commands.Bot(command_prefix="!", intents=intents, application_id="1331122986673115257")

# Google Apps Script 的 Web App URL
WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyUIuDJj4tgP991td2PTxZihaWDRic1W2Upz9EJ0tE4ID5w5JuNXuMD6bnENFhRzaILfQ/exec"

# 指定要閱讀訊息的頻道 ID
TARGET_CHANNEL_IDS = {1085509216824999996, 1107524844700045345}  # 神魔頻道 & 個人頻道
BOT_LIKE_USER_ID = 639382101455667202  # 機器人類型的使用者 ID

# 為處理文字查詢使用一個 semaphore (限制同時只處理一筆文字查詢)
text_query_semaphore = asyncio.Semaphore(1)

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
                    mission_desc = mission[2] + ("\n" + mission[3] if mission[3] else "")

                    if not mission_title or not mission_desc:
                        undefined_missions.append(mission[0])
                    else:
                        # 確保任務內容的每一行都帶 `> ` 引用標註
                        formatted_desc = "\n".join([f"> {line}" for line in mission_desc.split("\n")])
                        missions_text.append(f"**任務 {mission[0]}: {mission_title}**\n{formatted_desc}")

            if undefined_missions:
                undefined_message = f"⚠️ 以下任務尚未訂定：任務{', '.join(map(str, undefined_missions))}"
                missions_text.append(undefined_message)

            reply_message = "以下是本月的任務:\n\n" + "\n\n".join(missions_text) + f"\n\n{data['a1Data']}"
            await interaction.followup.send(reply_message, ephemeral=True)

###############################################################################
# Slash Command 指令 2: /查詢
# 此指令接受一個 uid 參數，回傳該 UID 當前月的查詢狀態
###############################################################################
@bot.tree.command(name="查詢", description="查詢 UID 任務完成度")
async def query(interaction: discord.Interaction, uid: str):
    await interaction.response.defer(ephemeral=True)
    if not re.match(r'^\d{5,}$', uid):
        await interaction.followup.send("不要玩機器人，請輸入正確uid", ephemeral=True)
        return
    current_month = datetime.now().month
    print(f"查詢 UID {uid} ，處理中 (Slash Command)")

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
                await interaction.followup.send(f"錯誤：UID not found (UID: {uid})", ephemeral=True)
                return

            second_row = data.get("secondRow", [])
            user_data = data.get("data", [])
            a1 = data.get("firstRow", [])

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

            formatted_output = [output[0]] + [f"> {line}" for line in output[1:]] + [f"\n{a1[0]}"]
            await interaction.followup.send("\n".join(formatted_output), ephemeral=False)

###############################################################################
# Slash Command 指令 3: /前往
# 此指令觸發後會帶使用者前往指定網址（附上按鈕連結）
###############################################################################
@bot.tree.command(name="前往", description="前往指定網址")
async def go(interaction: discord.Interaction):
    url = "https://docs.google.com/spreadsheets/d/1pqu3CQfHbmvnc122q6Eii9LU_v8BUD-tNuPr2X86-Ow/"
    # 建立一個按鈕，點擊後可前往指定網址
    button = discord.ui.Button(label="點此前往", url=url)
    view = discord.ui.View()
    view.add_item(button)
    await interaction.response.send_message("請點擊下方按鈕前往官方表格：", view=view, ephemeral=True)

###############################################################################
# Slash Command 指令 4: /常見問題
# 此指令提供「如何報名」和「為什麼紀錄沒有更新」的解答
###############################################################################
@bot.tree.command(name="常見問題", description="查看常見問題的解答")
async def faq(interaction: discord.Interaction):
    # 创建下拉菜单选项
    select = Select(
        placeholder="選擇你想問的問題",  # 提示信息
        options=[
            discord.SelectOption(label="如何報名", description="如何報名參加活動", value="如何報名"),
            discord.SelectOption(label="為什麼紀錄沒有更新", description="了解紀錄更新問題", value="為什麼紀錄沒有更新")
        ]
    )

    # 定义一个回调函数来处理用户选择
    async def select_callback(interaction: discord.Interaction):
        問題 = select.values[0]  # 获取用户选择的选项
        faq_responses = {
            "如何報名": (
                "你在小教室畢業的時候應該有填一份表單，填了就報名了，"
                "遊戲裡的信箱才會收到這裡的連結。\n\n"
                "群組任務是官方會自己統計，表單定期更新，"
                "所以表單裡找不到你的話可以等到下一次更新再找找看。\n\n"
                "更新了還找不到的話就 @小幫手"
            ),
            "為什麼紀錄沒有更新": (
                "由於表單是人手手動更新，所以關卡打過後都需要等到下次人員更新後，"
                "才會看到標註。\n\n通常是有打過，獎勳就一定會進到背包，"
                "如果沒有，再標註 @小幫手。"
            ),
        }

        response = faq_responses.get(問題, "請選擇有效的問題：「如何報名」或「為什麼紀錄沒有更新」")
        await interaction.response.send_message(response, ephemeral=True)  # 只對發送者可見

    # 设置回调函数
    select.callback = select_callback

    # 创建 View 来显示 Select 元素
    view = View()
    view.add_item(select)

    # 发送带有选择菜单的消息，且仅对用户可见
    await interaction.response.send_message("請選擇你有問題的項目：", view=view, ephemeral=True)  # 只對發送者可見



###############################################################################
# 處理文字查詢的函式 (由 on_message 觸發)
###############################################################################
async def process_text_query(uid, message):
    # 利用 semaphore 確保同一時間只處理一筆文字查詢
    async with text_query_semaphore:
        try:
            current_month = datetime.now().month
            print(f"查詢 UID {uid} ，處理中 (文字訊息)")
            # 顯示「正在輸入」狀態
            async with message.channel.typing():
                async with aiohttp.ClientSession() as session:
                    async with session.post(WEB_APP_URL, data={"UID": uid, "month": current_month, "IP": "Discord_bot_message"}) as response:
                        if response.status != 200:
                            await message.channel.send(f"查詢失敗：UID {uid} 請前往表單人工查詢，或稍後再試。")
                            return
                        try:
                            data = await response.json()
                        except Exception as e:
                            await message.channel.send(f"發生錯誤：機器人壞掉了 (UID: {uid})")
                            return

                        if "error" in data:
                            if data["error"] == "UID not found or month data not available":
                                await message.channel.send(f"錯誤：UID not found (UID: {uid})")
                            else:
                                await message.channel.send(f"錯誤：{data['error']} (UID: {uid})")
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
                        await message.channel.send("\n".join(formatted_output) + "\n")
        except Exception as e:
            await message.channel.send(f"發生錯誤：{str(e)} (UID: {uid})")

###############################################################################
# 訊息事件監聽 (處理文字中的查詢)
###############################################################################
@bot.event
async def on_message(message):
    if message.author == bot.user or message.channel.id not in TARGET_CHANNEL_IDS:
        return

    # 使用正規表示式擷取查詢的 UID
    uid_matches = re.findall(r"查[詢|询\s:：]*([0-9]+)", message.content)
    if uid_matches:
        for uid in uid_matches:
            # 將文字查詢以非同步任務方式處理，避免阻塞其他事件（如 Slash 指令）
            asyncio.create_task(process_text_query(uid, message))
            print(f"已將 UID {uid} 的文字查詢加入處理")
    else:
        # 檢查是否有任何 5 位數以上的數字，如果有則提示格式錯誤
        contains_numbers = re.search(r"\d{5,}", message.content)
        counta = 5
        if contains_numbers:
            error_message = await message.channel.send(f'請確認輸入格式，( "查詢XXXX" 或使用 "/查詢" 指令進行搜尋 )\n這條消息將於 {counta} 秒後刪除')
            time.sleep(0.7)
            # 倒计时提示
            for i in range(counta-1, 0, -1):
                await error_message.edit(content=f'請確認輸入格式，( "查詢XXXX" 或使用 "/查詢" 指令進行搜尋 )\n這條消息將於 {i} 秒後刪除')
                await asyncio.sleep(1)

            # 等待 10 秒后删除错误消息
            await error_message.delete()

###############################################################################
# 啟動機器人的事件：同步 Slash Command 並顯示登入訊息
###############################################################################
@bot.event
async def on_ready():
    await bot.tree.sync()
    print(f"目前登入身份 --> {bot.user}")

###############################################################################
# 啟動機器人
###############################################################################

bot.run()
