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
        mission : [[1,"","",""],[2,"成功挑戰10月 每月挑戰的 Lv.7","- 異彩史萊姆 10 隻","- 龍刻背包 5 格"],[3,"成功獲得「正幸」","- 瘋頭1隻","- 靈精魄 x 10"],[4,"","",""],[5,"","",""],[6,"成功獲得「魯米納斯 ‧ 瓦倫泰」","- 魔法石 1 顆","- 背包擴充 5 格"],["Extra1","完成任意 4 個或以上任務","- 霓彩鳥 1 隻",""],["Extra2","完成 所有任務","- 魔法石 2 顆",""]]
    };
    */

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

    const savedUID = localStorage.getItem('savedUID');
    if (savedUID) {
        $('#uidInput').val(savedUID); // 将保存的 UID 填入输入框
        searchUID(); // 自动搜索
    }
});

function searchUID() {
    var uid = $('#uidInput').val(); // 使用 jQuery 获取 UID
    // 禁用输入框
    $('#uidInput').prop('disabled', true);

    if (!uid) {
        $('#result').css('display', 'block').html('<div>請輸入 UID</div>');
        // 重新启用输入框
        $('#uidInput').prop('disabled', false);
        return;
    } else {
        localStorage.setItem('savedUID', uid); // 将 UID 保存到 localStorage
    }

    $('#result').css('display', 'block').text('搜尋中請稍後');

    // 控制点数变化的数组
    const dots = ['.', '..', '...'];
    let dotIndex = 0; // 当前显示的点数索引
    const loadingInterval = setInterval(function() {
        $('#result').text('搜尋中請稍後' + dots[dotIndex]); // 更新文本
        dotIndex = (dotIndex + 1) % dots.length; // 更新索引以循环
    }, 500); // 每 500 毫秒更新一次

    $('.search-icon').css('display', 'block');

    var scriptUrl = "https://script.google.com/macros/s/AKfycbzW3D-bsSDVQV0mg-cOKT0JVfpKwIeYxO9hmC7oU3AnCc5V49cJJQzpgoKijLNPylAaQA/exec";

    // 使用 jQuery 的 POST 方法
    $.post(scriptUrl, { UID: uid }, function(data) {
        if (data) {
            displayResult(data);
        } else {
            $('#result').html('<div>未找到 UID。</div>');
        }
    }, 'json') // 这里指定返回的数据类型为 JSON
    .fail(function(jqXHR) {
        // 当请求失败时显示错误信息
        if (jqXHR.responseText) {
            $('#result').html('<div>出錯了: ' + jqXHR.responseText + ' 請輸入正確的UID</div>');
        } else {
            $('#result').html('<div>出錯了: ' + jqXHR.statusText + '</div>');
        }
    })
    .always(function() {
        clearInterval(loadingInterval); // 清除点数循环
        $('#result').css('display', 'block'); // 请求完成后显示结果区域
        $('.search-icon').css('display', 'none');
    });
}

// 显示返回的结果
function displayResult(data) {
    var resultDiv = $('#result');
    resultDiv.html(''); // 清空之前的结果

    var isMismatch = false; // 用来标记是否存在不匹配

    // 比对 firstRow 和 mission 第二项的内容
    for (var i = 1; i < data.firstRow.length - 1; i++) {
        if (data.firstRow[i] !== data.mission[i - 1][2]) {
            // 如果不相同，替换 firstRow 的内容为 mission 第二个位置
            data.firstRow[i] = data.mission[i - 1][2];
            isMismatch = true; // 设置不匹配标记
        }
    }

    // 如果存在不匹配，显示警告信息
    if (isMismatch) {
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
        var td = $('<td>').text(j === 0 ? data.data[0] || '--' : data.data[j] !== undefined ? data.data[j] : '--');
        if (data.data[j] === 'F') {
            td.css({
                color: 'red',
                fontWeight: 'bold'
            });
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

    // 重新启用输入框
    $('#uidInput').prop('disabled', false);
}
