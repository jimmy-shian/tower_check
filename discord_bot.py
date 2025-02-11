import discord
import aiohttp
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

###############################################################################
# Slash Command 指令 1: /任務
# 此指令不接受參數，直接回傳當前月的任務資料。
###############################################################################
@bot.tree.command(name="任務", description="查詢當前月分的任務說明&獎勳")
async def task(interaction: discord.Interaction):
    # 先回覆一則暫時的訊息，告知使用者正在處理中
    await interaction.response.defer( ephemeral=True)
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

            # 過濾出任務及說明的資料
            missions_text = []
            undefined_missions = []
            for mission in data["mission"]:
                if len(mission) >= 3:
                    mission_title = mission[1]
                    mission_desc = mission[2]
                    # 若任務標題或說明缺少，則記錄任務編號
                    if not mission_title or not mission_desc:
                        undefined_missions.append(mission[0])
                    else:
                        missions_text.append(f"**任務 {mission[0]}: {mission_title}**\n> {mission_desc}")
            # 如果有未訂定的任務，則附加一則提示訊息
            if undefined_missions:
                undefined_message = f"以下任務尚未訂定：任務{',  '.join(map(str, undefined_missions))}"
                missions_text.append(undefined_message)
            reply_message = "以下是本月的任務:\n\n" + "\n\n".join(missions_text)
            await interaction.followup.send(reply_message, ephemeral=True)  # 設為 ephemeral

###############################################################################
# Slash Command 指令 2: /查詢
# 此指令接受一個 uid 參數，回傳該 UID 當前月的查詢狀態
###############################################################################
@bot.tree.command(name="查詢", description="查詢 UID 任務完成度")
async def query(interaction: discord.Interaction, uid: str):
    # 延後回覆（defer）讓使用者看到「正在處理」狀態
    await interaction.response.defer( ephemeral=True)
    current_month = datetime.now().month
    print(f"查詢 UID {uid} ，處理中")
    async with aiohttp.ClientSession() as session:
        # 使用 POST 傳送 uid 與當前月份到後端
        async with session.post(WEB_APP_URL, data={"UID": uid, "month": current_month, "IP": "Discord_bot"}) as response:
            if response.status != 200:
                await interaction.followup.send(f"查詢失敗：UID {uid} 請稍後再試。", ephemeral=True)  # 錯誤訊息顯示為 ephemeral
                return
            try:
                data = await response.json()
            except Exception:
                await interaction.followup.send(f"發生錯誤：機器人錯誤 (UID: {uid})", ephemeral=True)  # 錯誤訊息顯示為 ephemeral
                return

            # 若後端回傳錯誤訊息，直接回覆使用者
            if "error" in data:
                if data["error"] == "UID not found or month data not available":
                    await interaction.followup.send(f"錯誤：UID not found (UID: {uid})", ephemeral=True)  # 錯誤訊息顯示為 ephemeral
                else:
                    await interaction.followup.send(f"錯誤：{data['error']} (UID: {uid})", ephemeral=True)  # 錯誤訊息顯示為 ephemeral
                return

            # 解析後端回傳的資料
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
            await interaction.followup.send("\n".join(formatted_output), ephemeral=False)  # 成功回應顯示為普通訊息

###############################################################################
# 機器人啟動後同步 Slash Commands，並顯示登入資訊
###############################################################################
@bot.event
async def on_ready():
    await bot.tree.sync()  # 同步指令至 Discord
    print(f"目前登入身份 --> {bot.user}")

###############################################################################
# 啟動機器

bot.run()
