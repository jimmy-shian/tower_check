    // 模拟的返回数据
    /*
    const data = {
        data: [28218873, 'T', 'T', 'T', 'T', 'F', 'T', 5],
        firstRow: [
            '最後更新日期: 2024-10-01',
            '- 黃金蝦 10 隻\n- 人面雛鳥10隻\n- 靈魂 x 300',
            '- 異彩史萊姆 10 隻\n- 龍刻背包 5 格',
            '- 瘋頭 1 隻\n- 靈精魄 x 10',
            '- 人面怪鳥 1 隻\n- 金果蛾龍 5 隻',
            '- 體力藥水 100 點 x 1\n- 背包擴充 5 格',
            '- 魔法石 1 顆\r\n- 背包擴充 5 格',
            ''
        ],
        secondRow: ['DC新玩家 UID', '任務1', '任務2', '任務3', '任務4', '任務5', '任務6', '任務完成數'],
        mission : [[1,"","",""],[2,"成功挑戰10月 每月挑戰的 Lv.7","- 異彩史萊姆 10 隻","- 龍刻背包 5 格"],[3,"成功獲得「正幸」","- 瘋頭1隻","- 靈精魄 x 10"],[4,"","",""],[5,"","",""],[6,"成功獲得「魯米納斯 ‧ 瓦倫泰」","- 魔法石 1 顆","- 背包擴充 5 格"],["Extra1","完成任意 4 個或以上任務","- 霓彩鳥 1 隻",""],["Extra2","完成 所有任務","- 魔法石 2 顆",""]],
        monthExists: false
    };
    */

var currentMonth ;
var month ;
var monthExists ;
var isStrict = false;

var uidMatches ;

var finished_flag = true; // 這是用來控制是否可以發送下一個批次的旗標
var extra_flag = false;    
var one_uid = false;
var howmany = "";
var out_index;
    // 監聽輸入框的鍵盤事件
$(document).ready(function() {

    // 當頁面加載完成後自動聚焦到輸入框
    $('#uidInput').focus();
    // 监听 Enter 键按下
    $('#uidInput').on('keypress', function(event) {
        if (event.key === 'Enter') { // 检查是否按下 Enter 键
            extractUIDs(); // 调用搜索函数
        }
    });
    var uid;
    // 加载并显示记录
    displayRecords();
    
    // 获取当前月份 (1-12)，并转换为两位数格式
    currentMonth = new Date().getMonth() + 1; // getMonth() 返回值是 0-11，需要加 1
    var formattedMonth = ("0" + currentMonth).slice(-2); // 确保是两位数

    // 将默认月份设置为当前月份
    $('#monthSelect').val(formattedMonth);
    
    const savedUID = localStorage.getItem('savedUID');
    if (savedUID) {
        $('#uidInput').val(savedUID); // 将保存的 UID 填入输入框

        extractUIDs(); // 自动搜索
    }
    
});

// 當月份選擇器的值改變時觸發
$('#monthSelect').change(function() {
    var uidInput = $('#uidInput').val(); // 獲取 UID 輸入框的值
    
    if (uidInput) { extractUIDs(); }// UID 不為空，觸發搜尋

});

// 當 checkbox 狀態改變時觸發結果重新顯示
$('#useStrictCheck').on('change', function() {
    isStrict = $("#useStrictCheck").is(':checked');  // 判斷是否使用嚴格判斷
    displayRecords(); // 更新显示记录

});

$('#toggleButton').on('click', function() {
    $('#result').slideToggle(300, function() {
        // 在動畫完成後檢查結果的可見性
        if ($('#result').is(':visible')) {
            $('#toggleButton').text('收合'); // 若顯示則改為"收合"
        } else {
            $('#toggleButton').text('展開'); // 若隱藏則改為"展開"
        }
    });
});

function saveRecord(recordStr, recordStr_a) {
    let today = new Date();
    let expiryDate = new Date(today);
    expiryDate.setDate(today.getDate() + 1); // 设置过期时间为一天后

    // 创建记录对象
    const recordObject = {
        record1: recordStr,
        record2: recordStr_a,
        expiry: expiryDate.toISOString() // 将过期日期转换为 ISO 字符串
    };

    // 从 localStorage 中获取当前记录
    let records = JSON.parse(localStorage.getItem('missionRecords')) || [];

    // 解析记录中的 UID（假设 UID 在字符串的开始）
    const uid = recordStr.split(' ')[0];

    function updateRecords(records, uid, record, recordObject) {
        // 查找是否已存在相同 UID 的记录，并替换
        const index = records.findIndex(item => item[record].startsWith(uid));
        if (index !== -1) {
            records[index] = recordObject; // 替换现有记录
        } else {
            records.push(recordObject); // 添加新记录
        }

        return records;
    }
    // 查找是否已存在相同 UID 的记录，并替换
    // 更新 records
    records = updateRecords(records, uid, 'record1', recordObject);
    records = updateRecords(records, uid, 'record2', recordObject);


    localStorage.setItem('missionRecords', JSON.stringify(records)); // 更新 localStorage
    finished_flag = true; // 這是用來控制是否可以發送下一個批次的旗標
    displayRecords(); // 更新显示记录
    
}


// 显示记录
function displayRecords() {
    // 假設你已經包含 jQuery 並在 HTML 中添加了相應的結構
    $('a').on('click', function(e) {
        e.preventDefault(); // 防止預設的錨點跳轉
        var uig = $(this).attr('href').substring(1); // 獲取 href 中的 id
        console.log("uig=", uig);

        // 使用原生 JavaScript 獲取目標元素
        var targetElement = document.getElementById(uig);
        var targetElement1 = document.getElementById(uig + '_1');

        // 定義要處理的元素
        const targetElements = [targetElement, targetElement1];

        // 快速滾動到元素並添加閃爍效果
        targetElements.forEach(element => {
            if (element) {
                element.scrollIntoView({ behavior: 'auto' });
                element.classList.add('flash');
            }
        });


        // 設置一個定時器，在動畫結束後移除閃爍效果
        setTimeout(function() {
            if (targetElement) {
                targetElement.classList.remove('flash');
            }
            if (targetElement1) {
                targetElement1.classList.remove('flash');
            }
        }, 3000); // 2 秒後移除閃爍效果
    });

    
    let records = JSON.parse(localStorage.getItem('missionRecords')) || [];
    let today = new Date();
    isStrict = $("#useStrictCheck").is(':checked');  // 判斷是否使用嚴格判斷

    // 清除过期记录
    records = records.filter(r => new Date(r.expiry) > today);
    localStorage.setItem('missionRecords', JSON.stringify(records));

    // 显示记录
    let recordDiv = $('#recordList');
    recordDiv.html(''); // 清空现有记录

    if (howmany) {  // 判斷 isStrict 且 howmany 有內容
        // 構建記錄顯示字符串
        if (howmany.endsWith('、')) {
            howmany = howmany.slice(0, -1) + '，';
        }
        let displayText = `${howmany}還未訂定`;
        // 移除結尾的 "、" 改成 "，"
        if (isStrict){
            recordDiv.append(`<label><div class="record-place" style="background-color: #ff87b8;"><input type="checkbox" class="record-checkbox" checked>${displayText}</div></label>`);
        }else{
            recordDiv.append(`<label><div class="record-place" style="background-color: #ff87b8;"><input type="checkbox" class="record-checkbox">${displayText}</div></label>`);
        }
    }

    if (records.length === 0) {
        recordDiv.css('display', 'none'); // 如果记录为空，隐藏记录列表
    } else {
        recordDiv.css('display', 'block'); // 如果有记录，显示记录列表
        records.forEach(item => {
            if (isStrict){
                recordDiv.append(`<label><div class="record-place" id="${item.record2.split(' ')[0]}_1"><input type="checkbox" class="record-checkbox" checked> ${item.record2}</div></label>`);

            } else{
                recordDiv.append(`<label><div class="record-place" id="${item.record1.split(' ')[0]}_1"><input type="checkbox" class="record-checkbox" checked> ${item.record1}</div></label>`);
            }
        });
    }
    
}

// 複製到剪贴板
$('#copyButton').on('click', function() {
    let textToCopy = '';
    $('.record-checkbox:checked').each(function() {
        let text = $(this).parent().text().trim();
        textToCopy += text + '\n';
    });

    // 检查要複製的文本是否为空
    if (textToCopy.trim() === '') {
        return; // 如果内容为空，则退出函数，不执行复制
    }
    
    // 使用剪贴板API複製文本
    navigator.clipboard.writeText(textToCopy).then(function() {
        // 如果複製成功，顯示通知
        showCustomNotification('已複製內容！');
    }, function(err) {
        // 如果複製失敗，顯示通知
        showCustomNotification('複製失敗：' + err);
    });
});

// 顯示自定義通知的函數
function showCustomNotification(message) {
    // 創建一個通知元素
    const notification = $('<div class="custom-notification"></div>').text(message);
    $('body').append(notification);
    
    // 設定通知樣式
    notification.css({
        position: 'fixed',
        top: '50%', // 垂直居中
        left: '50%', // 水平居中
        transform: 'translate(-50%, -50%)', // 將元素的中心點移到 (50%, 50%)
        backgroundColor: '#444',
        color: '#fff',
        padding: '10px',
        borderRadius: '5px',
        zIndex: 1000,
        opacity: 0,
        transition: 'opacity 0.2s'
    });

    // 顯示通知
    notification.animate({ opacity: 1 }, 500).delay(1000).animate({ opacity: 0 }, 500, function() {
        $(this).remove(); // 2秒後移除通知
    });
}


// 清除记录
$('#clearRecords').on('click', function() {
    $('#recordList').empty(); // 清空记录列表
    localStorage.removeItem('missionRecords'); // 清除 localStorage 中的记录
    $('#recordList').css('display', 'none');
    
});


     

function extractUIDs() {
    $('#result').html('');
    $('#result_notice').html('');

    extra_flag = false;    
    
    var inputText = $('#uidInput').val();
    
//    inputText = `迎著朝陽綻放的新蕊 — 2024/10/12 16:27
//查詢 1009972970
//zhe-tw — 2024/10查詢1004316880
//moonnight_9907 — 昨天 18:10我783375644查詢 1019036672PeiXing — 昨天 20:11查詢74286024SimplePerson — 昨天 23:11查詢 1019229096 余仁傑 814771175— 今天 04:25查詢493506273`;
    
    let uidMatches = inputText.match(/\d{7,10}\d/g);
    
    if (uidMatches && uidMatches.length == 1) {
        one_uid = true;
    }else{
        one_uid = false;
    }
    
    if (uidMatches && uidMatches.length > 0) {
        sendUIDsInBatches(uidMatches, 500);
    } else {
        $('#result_notice').text("未找到有效的 UID");
    }
}

function sendUIDsInBatches(uids, delay, batchSize = 1) {
    let index = 0;
    out_index = index;
    
    function sendNextBatch() {
        if (index > uids.length) { // 應該用 >= 而不是 >
            $('#result_notice').html( $('#result_notice').html().replace("正在搜尋", "完成搜尋") )
            $('.search-icon').css('display', 'none');
            $('#uidInput').prop('disabled', false);
            $('#monthSelect').prop('disabled', false);
            $('.search-btn').prop('disabled', false);
            if ( one_uid ){
                $('#result_notice').text("搜尋完畢");
                // 顯示後 2 秒隱藏結果通知
                setTimeout(() => {
                    $('#result_notice').hide().text(""); // 隱藏
                }, 1500);  
            }
            return;
        } 
        if ((uids.length - index) == 0) {
            extra_flag = true;    
        }
        
        if (!finished_flag) {
            // 如果 finished_flag 為 false，則等待，直到它變為 true
            setTimeout(sendNextBatch, delay); // 每 100 毫秒檢查一次
            return;
        }

        let batch = uids.slice(index, index + batchSize);

        batch.forEach(uid => {
            searchUID(uid);
        });

        index += batchSize;
        out_index = index;
        sendNextBatch();

    }
    sendNextBatch();
}

function searchUID(uid_str) {
    finished_flag = false; // 這裡設置 finished_flag 為 false，表示正在處理
    
    uid = uid_str;
    month = $('#monthSelect').val();
    $('#result_notice').show();

    // 更新结果显示
    $('#result_notice').html(
        $('#result_notice').html().replace("正在搜尋", "完成搜尋") + 
        `正在搜尋 UID: <a href='#${uid}'>${uid}</a><br>`
    ).css("font-size", "1.25rem");


    $('#uidInput').prop('disabled', true);
    $('#monthSelect').prop('disabled', true);
    $('.search-btn').prop('disabled', true);

    if (!uid || !/^\d+$/.test(uid)) {
        $('#result_notice').html('<div>請輸入有效的 UID</div>');
        $('#uidInput').prop('disabled', false);
        $('#monthSelect').prop('disabled', false);
        $('.search-btn').prop('disabled', false);
        return;
    } else {
        localStorage.setItem('savedUID', uid);
    }

    const dots = ['.', '..', '...'];
    let dotIndex = 0;
    const loadingInterval = setInterval(function() {
        if (one_uid == true){
            $('#result_notice').text('搜尋中請稍後' + dots[dotIndex]).css("font-size", "1.5rem");
            dotIndex = (dotIndex + 1) % dots.length;
        }

    }, 500);

    $('.search-icon').css('display', 'block');

    var scriptUrl = "https://script.google.com/macros/s/AKfycbwoJGZRmBIcrE4wo9DUGrkzRdFsYdz3wkhXZYzxQ1aibQoDO5d08cEtWsJE_Z588vGPkw/exec";

    const startTime = performance.now();

    $.post(scriptUrl, { UID: uid, month: month }, null, 'json')
        .done(function(data) {
            if (data.error) {
                var errorM = '未搜尋到您的 UID: ' + `<a href='#${uid}'>${uid}</a>` + '，請至<a href="https://docs.google.com/spreadsheets/d/1pqu3CQfHbmvnc122q6Eii9LU_v8BUD-tNuPr2X86-Ow/edit#gid=1980706030" target="_blank">官方表單</a>確認';
                if (one_uid){
                    $('#result').html(
                        '<div><span style="color:red;">' + errorM + '</span></div>' // 用 <span> 包住錯誤訊息，並指定紅色
                    ).css("font-size", "1.25rem");
                }
                $('#result_notice').html(
                    $('#result_notice').html().replace(`正在搜尋 UID: <a href="#${uid}">${uid}</a><br>`, "") + 
                    '<div><span style="color:red;">' + errorM + '</span></div>' // 用 <span> 包住錯誤訊息，並指定紅色
                ).css("font-size", "1.25rem");
                saveRecord(`${uid} 沒收到你的報名`, `${uid} 沒收到你的報名，需要回遊戲信箱填寫表格`);
                return;
            }

            if (data.monthExists === false) {
                $('#result_notice').text("選取的月份資料不存在");
                monthExists = data.monthExists;
                displayResult(data);
            } else {
                displayResult(data);
            }
        })
        .fail(function(jqXHR) {
            if (jqXHR.responseText) {
                var errorM = '未搜尋到您的 UID: ' + uid + '，請至<a href="https://docs.google.com/spreadsheets/d/1pqu3CQfHbmvnc122q6Eii9LU_v8BUD-tNuPr2X86-Ow/edit#gid=1980706030" target="_blank">官方表單</a>確認';
                $('#result_notice').html('<div>出錯了: ' + jqXHR.responseText + ' 請輸入正確的UID<br>' + errorM + '</div>');
            } else {
                $('#result_notice').html('<div>出錯了: ' + jqXHR.statusText + '</div>');
            }
            saveRecord(`${uid} 沒收到你的報名`, `${uid} 沒收到你的報名，需要看回遊戲信箱填寫表格`);
        })
        .always(function() {
            clearInterval(loadingInterval);
            $('#result').css('display', 'block').css("font-size", "1.25rem");
            if ($('#result').is(':visible')) {
                $('#toggleButton').text('收合'); // 若顯示則改為"收合"
            } else {
                $('#toggleButton').text('展開'); // 若隱藏則改為"展開"
            }
            if( one_uid ){
                $('.search-icon').css('display', 'none');
                $('#uidInput').prop('disabled', false);
                $('#monthSelect').prop('disabled', false);
                $('.search-btn').prop('disabled', false);
            }

            const endTime = performance.now();
            const duration = endTime - startTime;
            const minutes = Math.floor(duration / 60000);
            const seconds = Math.floor((duration % 60000) / 1000);
            const milliseconds = Math.floor(duration % 1000);

            console.log(`執行時間: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}.${milliseconds}`);
        });
}

function generateRecordString(missionResults) {
    let recordStr = '';
    for (let id in missionResults) {
        if (missionResults[id].incomplete.length === 0) {
            recordStr += `${id} 全完成\n`;
        } else if (missionResults[id].incomplete.length === 6) {
            recordStr += `${id} 全部任務未完成\n`;
        } else {
            const incompleteTasks = missionResults[id].incomplete.map(task => task.replace('任務', ''));

            // 根據未完成任務的數量選擇連接符號
            let taskStr;
            if (incompleteTasks.length === 2) {
                taskStr = incompleteTasks.join(' & '); // 只有兩項，使用 &
            } else {
                taskStr = incompleteTasks.join('、'); // 多於兩項，使用 、 
            }

            recordStr += `${id} 任務${taskStr} 未完成\n`;
        }
    }
    return recordStr;
}

function displayResult(data) {
    howmany = "";
    var resultDiv = $('#result');

    if (!one_uid) {
        var titleDiv = $('<div>').html(`<h4 id="${uid}" style="margin: 10px;"><a href='#${uid}_1'>${out_index}. </a></h4>`);
        resultDiv.append(titleDiv);
    }

    
    var missionResults = {};
    if (!missionResults[uid]) {
        missionResults[uid] = { completed: [], incomplete: [] };
    }
    var missionResults_a = {};
    if (!missionResults_a[uid]) {
        missionResults_a[uid] = { completed: [], incomplete: [] };
    }
    var isMismatch = false;

    for (var i = 1; i < data.firstRow.length - 1; i++) {
        var firstRowValue = data.firstRow[i].toString().replace(/\s+/g, '').trim();
        var missionValue = (data.mission[i - 1][2] + data.mission[i - 1][3]).toString().replace(/\s+/g, '').trim();

        if (firstRowValue !== missionValue) {
            data.firstRow[i] = data.mission[i - 1][2] + data.mission[i - 1][3];
            isMismatch = true;
        }
    }

    if (isMismatch && currentMonth != month && monthExists) {
        var warningDiv = $('<div>').css('color', 'red').html('任務完成度可能還未更新，請以<a href="https://docs.google.com/spreadsheets/d/1pqu3CQfHbmvnc122q6Eii9LU_v8BUD-tNuPr2X86-Ow/edit#gid=1980706030" target="_blank">官方表單</a>為主');
        $('#result_notice').append(warningDiv);
    }

    var tablePlaceDiv = $('<div>').addClass('table-place');
    var table = $('<table>').css({
        width: '100%',
        borderCollapse: 'collapse'
    }).attr('border', '1');

    var headerRow = $('<tr>');
    $.each(data.secondRow, function(index, value) {
        $('<th>').text(value).appendTo(headerRow);
    });
    table.append(headerRow);

    var missionDetailRow = $('<tr>');
    $('<td>').text('任務詳情').appendTo(missionDetailRow);
    for (var j = 1; j < data.secondRow.length - 1; j++) {
        var missionTd = $('<td>').text(data.mission[j - 1] ? data.mission[j - 1][1] || '--' : '--');
        if (data.mission[j - 1][1] == ""){
            howmany += `任務${j}、`;
        }
        missionDetailRow.append(missionTd);
    }
    table.append(missionDetailRow);

    var statusRow = $('<tr>');
    for (var j = 0; j < data.secondRow.length; j++) {
        var td = $('<td>').html(j === 0 
            ? `<a href='#${uid}_1'>${data.data[0] || '--'}</a>` 
            : (data.data[j] !== undefined ? data.data[j] : '--')
        );
        
        if (data.data[j] === 'F' || data.data[j] === '') {
            td.css({
                color: 'red',
                fontWeight: 'bold'
            });
            missionResults_a[uid].incomplete.push(`任務${j}`);
        } else if (data.data[j] === 'T') {
            missionResults_a[uid].completed.push(`任務${j}`);
        }

        if (data.data[j] === 'F') {
            td.css({
                color: 'red',
                fontWeight: 'bold'
            });
            missionResults[uid].incomplete.push(`任務${j}`);
        } else if (data.data[j] === 'T') {
            missionResults[uid].completed.push(`任務${j}`);
        }

        statusRow.append(td);
    }
    table.append(statusRow);

    var rewardRow = $('<tr>');
    for (var k = 0; k < data.firstRow.length - 1; k++) {
        var rewardTd = $('<td>').html(k === 0 ? '' : data.firstRow[k] ? data.firstRow[k].replace(/\n/g, '<br>') : '--');
        rewardRow.append(rewardTd);
    }
    table.append(rewardRow);

    tablePlaceDiv.append(table);
    resultDiv.append(tablePlaceDiv);
    
    if (extra_flag){
        var extraDiv = $('<div>').html('<h3>額外任務</h3>');
        $.each(data.mission.slice(6), function(index, extraMission) {
            extraDiv.append(`<div>${extraMission[0]}: ${extraMission[1]} ${extraMission[2] || '--'}</div>`);
        });

        resultDiv.append(extraDiv);

        if (isMismatch || currentMonth == month && !monthExists) {
            var originalDiv = $('<div>').css("font-size", "1rem").html('<br>詳情請查看 <a href="https://docs.google.com/spreadsheets/d/1pqu3CQfHbmvnc122q6Eii9LU_v8BUD-tNuPr2X86-Ow/edit#gid=1980706030" target="_blank">官方表單</a>');
            resultDiv.append(originalDiv);
        }
    }

    let recordStr = generateRecordString(missionResults);
    let recordStr2 = generateRecordString(missionResults_a);

    saveRecord(recordStr.trim(), recordStr2.trim());

    displayRecords();
}
