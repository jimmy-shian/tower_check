import ctypes
import discord
import requests
from datetime import datetime
import re
import asyncio
import aiohttp

# 設置視窗標題
# ctypes.windll.kernel32.SetConsoleTitleW("DiscordBot")

intents = discord.Intents.default()
intents.message_content = True  # 啟用讀取訊息內容的權限
client = discord.Client(intents=intents)

# Google Apps Script 的 Web App URL
WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxxPa0ShIoz98S0Z9dsG3HLDeIZC0vqNoW4lQQ6bxtJ5jdmPBih_0jvtw2E_-cufLzABg/exec"

# 指定要閱讀訊息的頻道ID
TARGET_CHANNEL_ID = 1085509216824999996  # 神魔頻道
TARGET_CHANNEL_ID_my = 1107524844700045345 #我的個人
# 定義要視為機器人的使用者 ID
BOT_LIKE_USER_ID = 639382101455667202

# 建立一個 asyncio Queue 來管理查詢請求
query_queue = asyncio.Queue()


# 查詢處理函數

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
                    async with session.post(WEB_APP_URL, data={"UID": uid, "month": current_month}) as response:
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

# 查找最後一條機器人回覆的訊息

async def get_last_bot_message(channel):
    async for msg in channel.history(limit=100):  # 可以根據需要調整 limit
        if msg.author == client.user or msg.author.id == BOT_LIKE_USER_ID:
            return msg
    return None



# 回覆指定頻道內機器人尚未回覆的訊息
async def reply_unanswered_messages(channel):
    last_message = await get_last_bot_message(channel)

    # 若機器人沒有回覆過訊息，則從頭開始搜尋
    if not last_message:
        last_message = await channel.fetch_message(channel.last_message_id)

    async for message in channel.history(after=last_message.created_at, limit=100):
        if message.author != client.user:  # 排除機器人的訊息
            if "查" in message.content:
                # 提取所有 UID 並加入隊列
                uid_matches = re.findall(r"查[詢|询\s:：]*([0-9]+)", message.content)
                for uid in uid_matches:
                    print(f"已將 UID {uid} 加入隊列處理")
                    await query_queue.put((uid, message))



# 啟動排隊處理協程
@client.event
async def on_ready():
    print(f"目前登入身份 --> {client.user}")
    # 啟動查詢處理任務
    client.loop.create_task(process_queries())
    
    # 啟動回覆指定頻道的未回覆訊息
    target_channel = client.get_channel(TARGET_CHANNEL_ID)
    if target_channel:
        await reply_unanswered_messages(target_channel)


@client.event
async def on_message(message):
    # 避免處理機器人自己的訊息
    if message.author == client.user:
        return
    # 只有當訊息來自指定頻道時才處理
    if message.channel.id != TARGET_CHANNEL_ID and message.channel.id != TARGET_CHANNEL_ID_my :
        return
    
    # 偵測 "查詢" 並提取所有UID
    if "查" in message.content:
        uid_matches = re.findall(r"查[詢|询\s:：]*([0-9]+)", message.content)
        if uid_matches:
            for uid in uid_matches:
                # 將 UID 與訊息加入隊列
                await query_queue.put((uid, message))
                print(f"已將 UID {uid} 加入隊列處理")
        else:
            await message.channel.send("請檢查您的訊息格式為 `查詢 UID`")



client.run()
