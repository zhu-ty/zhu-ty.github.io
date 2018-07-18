// 获取页面传参
function initializeData(){
    function requestAjax(url) {
        return new Promise((resolve, reject) => {
            var req = new XMLHttpRequest();
            req.open('GET', url, true);
            req.onload = function () {
                if (req.status === 200) {
                    resolve(req.responseText);
                } else {
                    reject(new Error(req.statusText));
                }
            };
            req.onerror = function () {
                reject(new Error(req.statusText));
            };
            req.send();
        });
    }

    var request = {
        drop: ()=>{
            return requestAjax('data/drops.json').then(JSON.parse)
        },
        item: ()=>{
            return requestAjax('data/items.json').then(JSON.parse)
        },
        mob: ()=>{
            return requestAjax('data/mobs.json').then(JSON.parse)
        },
    }

    function main(){
        return Promise.all([request.drop(), request.item(), request.mob()])
    }

    return new Promise((resolve) => {
        main().then((value)=>{
            dropData = value[0]
            itemData = value[1]
            mobData = value[2]
            resolve()
        })
    })
}

function searchEngine(param){
    var page = parseInt(param["page"]);
    var mode = param["mode"];
    var il = parseInt(param["il"]);
    var query = param["query"];
    var resultArr = [];
    var count = 0;

    if ((il >=0) === false){
        il = 0
    }

    if ((page >= 1) === false){
        page = 1
    }

    if (mode === "monster" && query.length < 1){
        let data = Object.keys(mobData).slice((page-1)*10,page*10);
        count = Object.keys(mobData).length

        for (let index in data) {
            let no = data[index]
            let matchArr = [];

            matchArr.push(no);

            for (i in mobData[no]) {
                matchArr.push(mobData[no][i])
            }

            matchArr.push(searchDrop(no))
            resultArr.push(matchArr)
        }
    } else if(mode === "monster"){
        let hitArr = []

        for (let index in mobData) {
            if (mobData[index].name.indexOf(query) !== -1) {
                hitArr.push(index)
            }
        }

        let data = hitArr.slice((page-1)*10,page*10);
        count = hitArr.length

        for (let index in data) {
            let no = data[index]
            let matchArr = [];

            matchArr.push(no);

            for (i in mobData[no]) {
                matchArr.push(mobData[no][i])
            }

            matchArr.push(searchDrop(no))
            resultArr.push(matchArr)
        }
    } else if (mode === "item"){
        let itemIdArr = [];

        for (let index in itemData) {
            if (itemData[index].name.indexOf(query) !== -1 && itemData[index].lv >= il) {
                itemIdArr.push(parseInt(index));
            }
        }
        console.log(itemIdArr)

        let dropIdArr = [];
        for (let index in dropData){
            if (itemIdArr.indexOf(dropData[index].itemid) !== -1){
                dropIdArr.push(dropData[index].monsterid)
            }
        }
        console.log(dropIdArr);

        dropIdArr = Array.from(new Set(dropIdArr));
        let data = dropIdArr.slice((page-1)*10,page*10);
        count = dropIdArr.length

        for (let index in data) {
            let no = data[index]
            let matchArr = [];

            matchArr.push(no);

            for (i in mobData[no]) {
                matchArr.push(mobData[no][i])
            }

            matchArr.push(searchDrop(no))
            resultArr.push(matchArr)
        }
    }

    function searchDrop(mobId){
        let itemIdArr = []
        let itemArr = []

        for (let index in dropData){
            if (dropData[index].monsterid == mobId){
                itemIdArr.push(dropData[index].itemid)
            }
        }

        for (index in itemIdArr){
            let no = itemIdArr[index]
            if (typeof itemData[no] != undefined){
                itemArr.push([itemData[no].name, itemData[no].lv])
            } else{
                itemArr.push(["No Item Data", 0])
            }
        }

        return [itemIdArr, itemArr]
    }

    return {"data": resultArr, "count": count, "page": page, "mode": mode, "il": il, "query": query}
}

function request(paras){
    var url = location.href;
    var paraString = url.substring(url.indexOf("?")+1,url.length).split("&");
    var paraObj = {}
    for (i=0; j=paraString[i]; i++){
        paraObj[j.substring(0,j.indexOf("=")).toLowerCase()] = j.substring(j.indexOf("=")+1,j.length);
    }
    var returnValue = paraObj[paras.toLowerCase()];
    if(typeof(returnValue)=="undefined"){
        return "";
    }else{
        return returnValue;
    }
}

function getFormValue(form, setPage){
    var formArray = $("#"+form).serialize().split("&")
    var dict = {}
    formArray.forEach(function(string){
        if (string.split("=")[0] == "query"){
            dict[string.split("=")[0]] = decodeURI(string.split("=")[1])
        }else{
            dict[string.split("=")[0]] = string.split("=")[1]
        }
    })
    if (typeof(setPage) != "undefined"){
        dict["page"] = setPage
    }
    return dict
}

function createhref(link, mobname){
    var p = ""
    var more = false
    count = 0
    for (index in link[0]){
        var itemName = link[1][index][0]
        var itemLv = link[1][index][1]
        var itemNo = link[0][index]
        // var href = "<a href='?item=" + link[index] + "'>" + link[index] + "</a>/"
        if (filterSettings.showNoIl == false && itemLv < 1){
            continue;
        }
        if (filterSettings.showHasIl == false && itemLv >= 1){
            continue;
        }
        var href = `<img class="item-icon" data-item="${itemName}" data-toggle="tooltip" data-placement="top"
                    title="${itemName} ${itemLv>0?"IL." + itemLv:""}" 
                    src="img/itemIcon/${itemNo}.png"></img>`
        if (count == 22){
            href = href + `<div class="collapse" id="collapse${mobname}">`
            more = true
        }
        count ++
        p = p + href
    }
    if (more){
        p = p + `</div><a class="moretext" data-toggle="collapse" href="#collapse${mobname}" aria-expanded="false" 
            aria-controls="collapse${mobname}">▲ ▼</a>`
    }
    return p
}

$(document).ready(function(){
    filterSettings = {
        "showNoIl": true,
        "showHasIl": true,
    }
    function editCache(key, value){
        queryCache[key] = value
    }

    $("#form-search").on("submit",function(){
        queryCache = getFormValue("form-search")
        init()
        return false;
    }),

    queryCache = getFormValue("form-search")
    // Ajax
    initializeData().then(
        ()=>{init()}
        )

    function init(){
    $("#table-area").empty()
    $("#table-area").html(`<div class="alert alert-primary" role="alert">Loading, please wait.</div>`)
    // dataObj = $.ajax({
    //         url: "cgi-bin/data.py",
    //         data: queryCache,
    //     });
        data = searchEngine(queryCache)
        console.log(data);
    // dataObj.done(function(data){
        $("#table-area").empty()
        $("#foot-area").empty()
        if (typeof(data["error"]) != "undefined"){
            $("#table-area").html(`<div class="alert alert-danger" role="alert">${data["error"]}</div>`)
            return false;
        }
        page_int = data["page"]
        mobsdata = data["data"]
        totalpage = Math.ceil(data["count"] / 10)
        if (page_int > totalpage){
            page_int = 1
        }
        // 生成表格
        console.log(data["query"])
        if (data["query"]){
            if (data["data"].length > 0){
                var p = `<div class="alert alert-success" role="alert">Result${data["data"].length>1?"s":""} of searching
                <b> ${data["query"]}</b>.</div>`
                if (data["il"]>0 && data["mode"]!= "item"){
                    p = p + `<div class="alert alert-warning" role="alert">Item Level condition will be ignored while
                    searching by <b>monster name</b>.</div>`
                }
            } else {
                var p = `<div class="alert alert-warning" role="alert">No result of searching
                <b> ${data["query"]}. </b></div>`
            }
            $(p).appendTo($("#table-area"))
        }

        for (var index in mobsdata){
            var div = $(`<table class='table table-sm'>
            <th colspan="3"><b>${mobsdata[index][1]}</b> <span class="lvl"><b>Lv.</b>${mobsdata[index][2]}</span></th>
            <tr><td class="mobimg" rowspan='4'><img src='img/mobIcon/${mobsdata[index][0]}.png'/></td></tr>
            <tr><td colspan="2"><ul><b>EXP</b> ${mobsdata[index][4]}</ul>
            <ul><b>HP</b> ${mobsdata[index][3]}</ul><ul><b>MP</b> NO DATA</ul></td></tr>
            <tr><td colspan='2'>掉落：${createhref(mobsdata[index][5], mobsdata[index][0])}</td></tr>
            </table>`)
            div.appendTo($("#table-area"))
        }

        // hreflink = search_str
        // 页码导航 & 搜索
        if (data["data"].length > 0){
            var pager = $("<div><p>Page: " + page_int + "/" + totalpage + "</p></div>");
            pager.appendTo($("#foot-area"))
        }

        function createPI(currentPage){
            i = -2
            out = ""
            while (i < 3 && currentPage+i<=totalpage){
                if (currentPage+i >=1){
                out += `<li class="page-item ${currentPage+i==page_int?"active":""}">
                <a class="page-link" data-page="${currentPage+i}" href="#">${currentPage+i}</a></li>`
                }
                i ++
            }
            return out
        }
        var pageDef = `<nav aria-label="pageindicator">
            <ul class="pagination justify-content-end">
                ${page_int>1?`<li class="page-item">
                <a class="page-link" data-page="${page_int - 1}" href="#" tabindex="-1">\<</a>
                </li>`:""}
                ${page_int-3>=1?`<li class="page-item">
                <a class="page-link" data-page="1" href="#" tabindex="-1">&laquo;</a>
                </li>`:""}
                ${createPI(page_int)}
                ${page_int + 3 <= totalpage ?`</li><li class="page-item">
                <a class="page-link" data-page="${totalpage}" href="#" tabindex="-1">&raquo;</a>
                </li>`:""}
                ${page_int<totalpage?
                `<li class="page-item ${page_int>=totalpage?"disabled":""}">
                <a class="page-link" data-page="${page_int + 1}" href="#">\></a>
                </li>`:""}
            </ul></nav>`
        $(pageDef).appendTo($("#foot-area"))
        $('[data-toggle="tooltip"]').tooltip()
        $('[data-toggle="popover"]').popover({
            content: function(){
                return `<button type="button" data-bind="showNoIl" class="btn btn-primary 
                filter-btn ${filterSettings.showNoIl==true?"":"active"}" data-toggle="button"> IL = 0 </button>
                <button type="button" data-bind="showHasIl" class="btn btn-primary 
                filter-btn ${filterSettings.showHasIl==true?"":"active"}" data-toggle="button"> IL > 0 </button>
                <p>Applies in next search.</p>`               
            },
            html: true
        })
    // })
}

$("body").on("click", ".filter-btn", function(){
    if ($(this).attr("class").indexOf("active")== -1){
        filterSettings[$(this).attr("data-bind")] = false
    } else{
        filterSettings[$(this).attr("data-bind")] = true
    }
})

$("#foot-area").on("click", "a.page-link", function(){
    if (queryCache["page"] == $(this).attr("data-page")){
        return false;
    }
    editCache("page", $(this).attr("data-page"))
    init()
    return false;
})

$("#table-area").on("click", ".item-icon", function(){
    editCache("page", 1)
    editCache("mode", "item")
    editCache("query", $(this).attr("data-item"))
    $(".tooltip").remove()
    init()
    return false;
})
});

