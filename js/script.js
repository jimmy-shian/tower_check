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
    // 監聽輸入框的鍵盤事件
$(document).ready(function() {
    // 當頁面加載完成後自動聚焦到輸入框
    $('#uidInput').focus();
    // 监听 Enter 键按下
    $('#uidInput').on('keypress', function(event) {
        if (event.key === 'Enter') { // 检查是否按下 Enter 键
            searchUID(); // 调用搜索函数
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
        searchUID(); // 自动搜索
    }
    
});

// 當月份選擇器的值改變時觸發
$('#monthSelect').change(function() {
    var uidInput = $('#uidInput').val(); // 獲取 UID 輸入框的值

    if (uidInput) { searchUID(); }// UID 不為空，觸發搜尋

});

// 當 checkbox 狀態改變時觸發結果重新顯示
$('#useStrictCheck').on('change', function() {
    isStrict = $("#useStrictCheck").is(':checked');  // 判斷是否使用嚴格判斷
    displayRecords(); // 更新显示记录

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
    displayRecords(); // 更新显示记录
}


// 显示记录
function displayRecords() {
    let records = JSON.parse(localStorage.getItem('missionRecords')) || [];
    let today = new Date();
    isStrict = $("#useStrictCheck").is(':checked');  // 判斷是否使用嚴格判斷

    // 清除过期记录
    records = records.filter(r => new Date(r.expiry) > today);
    localStorage.setItem('missionRecords', JSON.stringify(records));

    // 显示记录
    let recordDiv = $('#recordList');
    recordDiv.html(''); // 清空现有记录
    if (records.length === 0) {
        recordDiv.css('display', 'none'); // 如果记录为空，隐藏记录列表
    } else {
        recordDiv.css('display', 'block'); // 如果有记录，显示记录列表
        records.forEach(item => {
            if (isStrict){
                recordDiv.append(`<label><div class="record-place"><input type="checkbox" class="record-checkbox" checked> ${item.record2}</div></label>`);

            } else{
                recordDiv.append(`<label><div class="record-place"><input type="checkbox" class="record-checkbox" checked> ${item.record1}</div></label>`);
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
        alert('已複製內容！');
    }, function(err) {
        alert('複製失敗：' + err);
    });
});

// 清除记录
$('#clearRecords').on('click', function() {
    $('#recordList').empty(); // 清空记录列表
    localStorage.removeItem('missionRecords'); // 清除 localStorage 中的记录
    $('#recordList').css('display', 'none');
    
});


function searchUID() {
    uid = $('#uidInput').val(); // 使用 jQuery 获取 UID
    month = $('#monthSelect').val(); // 获取选中的月份
    
    // 禁用输入框
    $('#uidInput').prop('disabled', true);
    $('#monthSelect').prop('disabled', true); // 禁用月份選擇器
    $('.search-btn').prop('disabled', true);


    if (!uid || !/^\d+$/.test(uid)) {  // 判斷 uid 是否為空或不是純數字
        $('#result').css('display', 'block').html('<div>請輸入有效的 UID</div>');
        // 重新启用输入框
        $('#uidInput').prop('disabled', false);
        $('#monthSelect').prop('disabled', false); // 禁用月份選擇器
        $('.search-btn').prop('disabled', false);

        return;
    } else {
        localStorage.setItem('savedUID', uid); // 将 UID 保存到 localStorage
    }

    $('#result').css('display', 'block').text('搜尋中請稍後');

    // 控制点数变化的数组
    const dots = ['.', '..', '...'];
    let dotIndex = 0; // 当前显示的点数索引
    const loadingInterval = setInterval(function() {
        $('#result').text('搜尋中請稍後' + dots[dotIndex]).css("font-size", "1.5rem"); // 更新文本
        dotIndex = (dotIndex + 1) % dots.length; // 更新索引以循环
    }, 500); // 每 500 毫秒更新一次

    $('.search-icon').css('display', 'block');

    var scriptUrl = "https://script.google.com/macros/s/AKfycbwoJGZRmBIcrE4wo9DUGrkzRdFsYdz3wkhXZYzxQ1aibQoDO5d08cEtWsJE_Z588vGPkw/exec";

    // 計時開始
    const startTime = performance.now(); // 獲取當前時間（毫秒）

    // 使用 jQuery 的 POST 方法
    $.post(scriptUrl, { UID: uid, month: month }, null, 'json') // 这里指定返回的数据类型为 JSON
        .done(function(data) {
            // 检查返回的数据是否包含错误
            if (data.error) {
                var errorM = '未搜尋到您的 UID: ' + uid + '，請至<a href="https://docs.google.com/spreadsheets/d/1pqu3CQfHbmvnc122q6Eii9LU_v8BUD-tNuPr2X86-Ow/edit#gid=1980706030" target="_blank">官方表單</a>確認';
                $('#result').html('<div>出錯了: 請輸入正確的UID<br>' + errorM + '</div>');
                return;
            }

            // 检查月份数据是否存在
            if (data.monthExists === false) {
                alert("選取的月份資料不存在");
//                console.log("data", data);
                monthExists = data.monthExists;
                displayResult(data);
            } else {
//                console.log("data", data);s
                displayResult(data);
            }
        })
        .fail(function(jqXHR) {
            // 当请求失败时显示错误信息
            if (jqXHR.responseText) {
                var errorM = '未搜尋到您的 UID: ' + uid + '，請至<a href="https://docs.google.com/spreadsheets/d/1pqu3CQfHbmvnc122q6Eii9LU_v8BUD-tNuPr2X86-Ow/edit#gid=1980706030" target="_blank">官方表單</a>確認';
                $('#result').html('<div>出錯了: ' + jqXHR.responseText + ' 請輸入正確的UID<br>' + errorM + '</div>');
            } else {
                $('#result').html('<div>出錯了: ' + jqXHR.statusText + '</div>');
            }
        })
        .always(function() {
            clearInterval(loadingInterval); // 清除点数循环
            $('#result').css('display', 'block').css("font-size", "1.25rem");// 请求完成后显示结果区域
            $('.search-icon').css('display', 'none');
            // 重新启用输入框
            $('#uidInput').prop('disabled', false);
            $('#monthSelect').prop('disabled', false);
            $('.search-btn').prop('disabled', false);

            // 計時結束
            const endTime = performance.now(); // 獲取結束時間（毫秒）
            const duration = endTime - startTime; // 計算執行時間（毫秒）

            // 格式化執行時間為分:秒.毫秒
            const minutes = Math.floor(duration / 60000);
            const seconds = Math.floor((duration % 60000) / 1000);
            const milliseconds = Math.floor(duration % 1000);

            // 在控制台顯示執行時間
            console.log(`執行時間: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}.${milliseconds}`);
        });
}

// 生成记录字符串
function generateRecordString(missionResults) {
    let recordStr = '';
    for (let id in missionResults) {
        if (missionResults[id].incomplete.length === 0) {
            recordStr += `${id} 全完成\n`;
        } else if (missionResults[id].incomplete.length === 6) {
            recordStr += `${id} 全部任務未完成\n`;
        } else {
            const incompleteTasks = missionResults[id].incomplete.map(task => task.replace('任務', ''));
            recordStr += `${id} 任務${incompleteTasks.join('、')} 未完成\n`;
        }
    }
    return recordStr;
}

// 显示返回的结果
function displayResult(data) {
    var resultDiv = $('#result');
    resultDiv.html(''); // 清空之前的结果
    var missionResults = {};
    if (!missionResults[uid]) {
        missionResults[uid] = { completed: [], incomplete: [] };
    }
    var missionResults_a = {};
    if (!missionResults_a[uid]) {
        missionResults_a[uid] = { completed: [], incomplete: [] };
    }
    var isMismatch = false; // 用来标记是否存在不匹配

    // 比对 firstRow 和 mission 第二,三项的内容
    for (var i = 1; i < data.firstRow.length - 1; i++) {
        // 去除空白和格式
        var firstRowValue = data.firstRow[i].toString().replace(/\s+/g, '').trim(); // 去除空白
        var missionValue = (data.mission[i - 1][2] + data.mission[i - 1][3]).toString().replace(/\s+/g, '').trim(); // 去除空白
//        console.log("text=", firstRowValue, missionValue);

        if (firstRowValue !== missionValue) {
            // 如果不相同，替换 firstRow 的内容为 mission 第二,三个位置
            data.firstRow[i] = data.mission[i - 1][2] + data.mission[i - 1][3]; // 更新为去除格式的值
            isMismatch = true; // 设置不匹配标记
        }
    }

    // 如果存在不匹配，显示警告信息
    if (isMismatch && currentMonth != month && monthExists) {
        var warningDiv = $('<div>').css('color', 'red').html('任務完成度可能還未更新，請以<a href="https://docs.google.com/spreadsheets/d/1pqu3CQfHbmvnc122q6Eii9LU_v8BUD-tNuPr2X86-Ow/edit#gid=1980706030" target="_blank">官方表單</a>為主');
        resultDiv.append(warningDiv);
    }

    // 创建一个 div 包裹表格
    var tablePlaceDiv = $('<div>').addClass('table-place');

    // 创建表格
    var table = $('<table>').css({
        width: '100%',
        borderCollapse: 'collapse'
    }).attr('border', '1');

    // 添加表头
    var headerRow = $('<tr>');
    $.each(data.secondRow, function(index, value) {
        $('<th>').text(value).appendTo(headerRow);
    });
    table.append(headerRow);

    // 添加任务详情行
    var missionDetailRow = $('<tr>');
    $('<td>').text('任務詳情').appendTo(missionDetailRow);
    for (var j = 1; j < data.secondRow.length - 1; j++) {
        var missionTd = $('<td>').text(data.mission[j - 1] ? data.mission[j - 1][1] || '--' : '--');
        missionDetailRow.append(missionTd);
    }
    table.append(missionDetailRow);

    // 添加任务状态行
    var statusRow = $('<tr>');
    for (var j = 0; j < data.secondRow.length; j++) {
        // 根據不同條件設置每行數據
        var td = $('<td>').text(j === 0 ? data.data[0] || '--' : data.data[j] !== undefined ? data.data[j] : '--');

            // 非嚴格判斷：判斷 'F' 或空字串 ''
            if (data.data[j] === 'F' || data.data[j] === '') {
                td.css({
                    color: 'red',
                    fontWeight: 'bold'
                });
                missionResults_a[uid].incomplete.push(`任務${j}`);
            } else if (data.data[j] === 'T') {
                missionResults_a[uid].completed.push(`任務${j}`);
            }
            // 嚴格判斷：只判斷 'F'
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


    // 添加奖励信息行
    var rewardRow = $('<tr>');
    for (var k = 0; k < data.firstRow.length - 1; k++) {
        var rewardTd = $('<td>').html(k === 0 ? '' : data.firstRow[k] ? data.firstRow[k].replace(/\n/g, '<br>') : '--');
        rewardRow.append(rewardTd);
    }
    table.append(rewardRow);

    // 将表格添加到 div 中
    tablePlaceDiv.append(table);
    resultDiv.append(tablePlaceDiv);

    // 添加 Extra 部分
    var extraDiv = $('<div>').html('<h3>額外任務</h3>');
    $.each(data.mission.slice(6), function(index, extraMission) {
        extraDiv.append(`<div>${extraMission[0]}: ${extraMission[1]} ${extraMission[2] || '--'}</div>`);
    });
    
    resultDiv.append(extraDiv);
    
    if (isMismatch || currentMonth == month && !monthExists) {
        var originalDiv = $('<div>').css("font-size", "1rem").html('<br>詳情請查看 <a href="https://docs.google.com/spreadsheets/d/1pqu3CQfHbmvnc122q6Eii9LU_v8BUD-tNuPr2X86-Ow/edit#gid=1980706030" target="_blank">官方表單</a>');
        resultDiv.append(originalDiv);
    }


//    console.log("missionResults=", missionResults);
    // 处理记录
    // 处理记录
    let recordStr = generateRecordString(missionResults);
    let recordStr2 = generateRecordString(missionResults_a);

    saveRecord(recordStr.trim(), recordStr2.trim());

    displayRecords(); // 更新显示记录
}

