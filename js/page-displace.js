$(function () {
    var papersLayer = $("#papers-layer");//版面弹出层
    var columnsLayer = $("#columns-layer");//版面弹出层
    var categoryLayer = $("#categroy-layer");//地方报
    var paperId="";
    var layoutName="";

    /*
     * 获取广州日报信息
     */
    function getGZRBPaper(){
        $.ajax({
            url:"js/getGZRBPaper.json",
            type: "post",
            async: false,
            dataType: "json",
            data: {},
            success: function (data) {
                paperId = data.paperId;
                layoutName = data.layoutName;
            },
            error:function (data) {
            }
        });
    };
    getGZRBPaper();


    /*
     * 获取当前日期
     */
    function getNowFormatDate(){
        var data = new Date();
        var CurrentDate = "";
        //初始化时间
        var Year = data.getFullYear();
        var Month = data.getMonth()+1;
        var Day = data.getDate();
        CurrentDate += Year + "-";
        if (Month >= 10 ){
            CurrentDate += Month + "-";
        }else{
            CurrentDate += "0" + Month + "-";
        }

        if (Day >= 10 ){
            CurrentDate += Day ;
        }else{
            CurrentDate += "0" + Day ;
        }

        return CurrentDate;
    };


    //获取的时间就会补零
    nowDate = getNowFormatDate();

    $('.choose-time').datetimepicker({
        format:"Y-m-d",      //格式化日期
        timepicker:false,    //关闭时间选项
        yearStart:2000,     //设置最小年份
        yearEnd:2050,        //设置最大年份
        todayButton:false,    //关闭选择今天按钮
        onSelectDate: function() {
            $("#displace-box .displace-big").remove();
            getChangeLayoutAll($(".choose-time").val(),1);
        },
    });
    $.datetimepicker.setLocale('ch');//设置中文格式
    $(".choose-time").val(nowDate);//设置默认时间

    //加载版面数据
    getPaperList("js/getPaperLayoutTreeList.json",papersLayer);

    //加载栏目数据
    getColumnList("js/getAllPaperColumnInfo.json",columnsLayer);

    //加载栏目数据
    getCategoryList("js/getCategory.json",categoryLayer);

    /*
     * 获取左侧树列表
     */
    function initLayoutTree() {
        var setting = {
            view: {
                selectedMulti: false
            },
            async: {
                enable: true,
                autoParam: ["id"],
                otherParam: ["paperId", paperId, "paperDate", $(".choose-time").val()],
                url: "js/getPaperLayoutTreeNew.json"// 请求的action路径
            },
            callback: {
                beforeClick: beforeClick,
                onClick: onClick,
                onAsyncSuccess: zTreeOnAsyncSuccess
            }
        };

        $.fn.zTree.init($("#treeDemo"), setting);
    };

    /*
     * 获取左侧树列表
     */
    function beforeClick(treeId, treeNode, clickFlag){
        treeNodeNameMoved = treeNode.name;//为调版做准备
        layoutIdMoved = treeNode.id;//为调版做准备：调版用的版面id
        layoutIdForSave=layoutIdMoved;
    };

    /*
     * 捕获异步加载正常结束的事件回调函数
     */
    function zTreeOnAsyncSuccess(event, treeId, treeNode, msg){
        var treeObj = $.fn.zTree.getZTreeObj("treeDemo");
        var sNodes = treeObj.getNodes();
        //展开树节点-第1级
        treeObj.expandNode(sNodes[0],true );
    };

    /*
     * 点击树节点时发生的事
     */
    function onClick(event,treeId,treeNode){
        nodeLayoutLevel = treeNode.layoutLevel;
        if(parentId!=treeNode.pid){
            if(treeNode.layoutLevel==3){//如果不在同一父节点下，点击第三级节点，changeMiddle
                changeMiddelPart(layoutIdMoved,paperDate);
                dieName = $.fn.zTree.getZTreeObj("treeDemo").getNodeByParam('id',treeNode.pid,null).name;
            }
            if(treeNode.layoutLevel==2){
                dieName =treeNode.name;
            }
            parentId=treeNode.pid;
        }
        if(treeNode.layoutLevel==2){//如果是叠则changeMiddle
            changeMiddelPart(layoutIdMoved,paperDate);
        }

        $("#layout"+layoutIdMoved).css({"background-color":"#FDE9BD"});

        if($("#layout"+layoutIdMoved).children('td').eq(0).html()!=null||ifPhoto){
//		console.log($("#layout"+treeNode.id));
            printingLayoutIfAvailable = true;
        }else{
            printingLayoutIfAvailable = false;
        }

        if(nodeLast != "#layout"+layoutIdMoved){
            $(nodeLast).css({"background-color":"#eee"});
            nodeLast = "#layout"+layoutIdMoved;

            if((treeNode.name+"").indexOf('[')>-1){
                // columnId = getColumnIdByLayoutId(layoutIdMoved);
                columnId = treeNode.columnid;
                $("#column"+columnId).css({"background-color":"#FDE9BD"});
                //如果选择的跟上次的不同，则将上一个节点的颜色恢复，并将标志位赋为当前对象。
                if(columnLastName != "#column"+columnId){
                    $(columnLastName).css({"background-color":"#eee"});
                    columnLastName = "#column"+columnId;
                }
                columnScrollControll = true;//说明该版面已经被关联。
            }else{
                columnId=0;//复位columnId,因为栏目那边已经不亮了。
                columnScrollControll = false;//说明该版面未被关联。
                $(columnLastName).css({"background-color":"#eee"});
            }
        }
        //滚动侦测q
        if($(nodeLast).offset()!=null){
            $('#layoutRelateColumn').animate({scrollTop:$(nodeLast).offset().top+$('#layoutRelateColumn').scrollTop()-300}, 800);
        }
        if($(columnLastName).offset()!=null){
            $('#columnTree').animate({scrollTop:$(columnLastName).offset().top+$('#columnTree').scrollTop()-300}, 800);
        }
    };

    //initLayoutTree();



    /*
     * 获取版面弹层数据
     */
    function getPaperList(url,box) {
        $.ajax({
            url:url,
            type: "post",
            dataType: "json",
            data: {
                paperId:paperId,
                paperDate:$(".choose-time").val()
            },
            beforeSend:function(){
                papersLayer.append("<div class='load'><img src='static/images/loading.gif'/></div>")
            },
            success: function (data) {
                var result = "";

                for(var i=0;i<data.length;i++){
                    result +="<ul class='papers-layer-ul clearfix'>";
                    for(var t=0;t<data[i].length;t++){
                        result +="<li class='item'><label><input type='radio' class='columnradio' layoutcode='"+data[i][t].layoutCode+"' layoutid='"+data[i][t].id+"' name='"+data[i][t].name+"'>"+data[i][t].name+"</label></li>";
                    }
                    result +="</ul>";
                }
                $(".load").hide();
                box.append(result);
            },
            error:function () {
                console.log(2)
            }
        });
    };

    /*
     * 获取栏目弹层数据
     */
    function getColumnList(url,box) {
        $.ajax({
            url:url,
            type: "post",
            dataType: "json",
            data: {
                paperId:paperId
            },
            success: function (data) {
                var result = "";
                result +="<ul class='columns-layer-ul clearfix'>";
                for(var i=0;i<data.length;i++){
                    result +="<li class='item'><label><input type='radio' class='columnradio' columnid='"+data[i].column_id+"' name='"+data[i].column_name+"'>"+data[i].column_name+"</label></li>";
                }
                result +="</ul>";
                box.append(result);
            },
            error:function () {
                console.log(data)
            }
        });
    };

    /*
     * 获取地方报弹层数据
     */
    function getCategoryList(url,box) {
        $.ajax({
            url:url,
            type: "post",
            dataType: "json",
            data: {},
            success: function (data) {
                var result = "";
                result +="<ul class='categroy-layer-ul clearfix'>";
                for(var i=0;i<data.length;i++){
                    result +="<li class='item'><label><input type='radio' class='columnradio' name='"+data[i].entry_NAME+"' entry_ID='"+data[i].entry_ID+"' entry_CODE='"+data[i].entry_CODE+"'>"+data[i].entry_NAME+"</label></li>";
                }
                result +="</ul>";
                box.append(result);
            },
            error:function () {
            }
        });
    };

    /*
     * 获取置换版
     */

    function getChangeLayoutAll(paperDate,paperId) {
        $.ajax({
            url:"js/getChangeLayoutAll.json",
            type: "get",
            dataType: "json",
            data: {
                paperDate:paperDate,
                paperId:paperId
            },
            success: function (data) {
                console.log(1)
            },
            error:function (data) {
                var data = [
                    {
                        "layoutid": "1",
                        "layoutName": "1版",
                        "category": "福州日报,东莞日报,河北日报", //代表地方报
                        "categoryId": "176,175,174",//代表地方报id
                        "column": [//每个地方报下对应的栏目
                            {
                                "categoryId": "176",
                                "columnIds": "2,3",
                                "columnNames": "栏目一,栏目二"
                            }
                        ]
                    }
                ];
                var html ="";
                for(var i in data){
                    html+='<div class="displace-big">'
                    html+='<div class="displace-title">'
                    html+='<span class="news-paper-name">广州日报</span>'
                    html+='<span class="paper-name" layoutid="'+data[i].layoutid+'">'+data[i].layoutName+'</span>'
                    html+='<a class="del-paper" href="javascript:;">×</a>'
                    html+='</div>'
                    html+='<div class="displace-list clearfix">'
                    html+='<a class="left-btn" href="javascript:;">左</a>'
                    html+='<a class="right-btn" href="javascript:;">右</a>'
                    html+='<div class="scrollBox">'
                    html+='<ul class="displaces">'
                    for(var t in data[i].column){
                        var categoryName = data[i].category.split(",");
                        html+='<li class="displace-item">'
                        html+='<div class="displace-list-top clearfix">'
                            html+='<a class="selectpaper" href="javascript:;" categoryId="'+data[i].column[t].categoryId+'">'+categoryName[t]+'</a>'
                        html+='<span><img src="images/ad.png" class="ad-icon"> 2.5</span>'
                        html+='</div>'
                        var coumnNameStr = data[i].column[t].columnNames.split(",");
                        var columnIdsStr = data[i].column[t].columnIds.split(",");
                            for(var k=0;k<coumnNameStr.length;k++){
                                html+='<a href="javascript:;" class="select-displace-column columtext" columnIds="'+columnIdsStr[k]+'">'+coumnNameStr[k]+'</a>';
                            }
                        html+='</li>'
                    }
                    html+='<a class="add-displace" href="javascript:;"><i class="add-icon">+</i>添加置换</a>'
                    html+='</ul>'
                    html+='</div>'
                    html+='</div>'
                    html+='</div>'
                }
                $("#displace-box").prepend(html);

                $(".displace-big .displace-item").each(function(){
                    if($(this).find(".select-displace-column").length==1&&$(this).find(".select-displace-column").text()==""){$(this).find(".select-displace-column:first").remove();
                        $(this).append('<a href="javascript:;" class="select-displace-column">选择栏目</a><a href="javascript:;" class="select-displace-column hide">选择栏目</a><a href="javascript:;" class="select-displace-column hide">选择栏目</a>');
                    }else if($(this).find(".select-displace-column").length==1){
                        $(this).append('<a href="javascript:;" class="select-displace-column">选择栏目</a><a href="javascript:;" class="select-displace-column hide">选择栏目</a>');
                    }else if($(this).find(".select-displace-column").length==2){$(this).append('<a href="javascript:;" class="select-displace-column">选择栏目</a>');
                    }
                });
                /*labScroll($(".displaces").width(),$(".displaces").find(".displace-item").size()+1,Math.ceil($('.displaces .displace-item').size()/1)*900,$('.displaces'))*/
            }
        });
    };
    getChangeLayoutAll();

    /*
     * 保存置换版
     */
    function saveChangeLayoutAll() {
        $.ajax({
            url:"js/saveChangeLayoutAll.json",
            type: "get",
            dataType: "json",
            data: {
                paperDate:nowDate,
                paperId:"1",
                paperPlanJson:JSON.stringify(GetChangeLayoutJson())
            },
            success: function (data) {
                console.log(nowDate)
            },
            error:function () {
            }
        });
    };



    /*
     * 版面置换数据
     */
    function GetChangeLayoutJson() {
        var json = [];
        $(".displace-list").each(function(index){
            var categoryNames = "";
            var categoryIds ="";
            var columnId = "";
            var categoryName = "";
            var categoryId = "";
            var jsonArr=[];


            $(this).find(".displace-item").each(function(index){
                categoryNames+=$(this).find(".selectpaper").text()+",";
                categoryIds+=$(this).find(".selectpaper").attr("entry_id")+",";
                categoryName=$(this).find(".selectpaper").text();
                categoryId=$(this).find(".selectpaper").attr("entry_id");
                columnId=$(this).find(".columtext").attr("columnid");

                jsonArr[index]={
                    "categoryId": categoryId,
                    "columnIds": columnId,
                    "columnNames": categoryName
                }

                //console.log(jsonArr)

            });
            json[index]={
                "layoutid":$(this).parents(".displace-big").find(".paper-name").attr("layoutid"),
                "layoutName":$(this).parents(".displace-big").find(".paper-name").text(),
                "category": categoryNames.substring(0,categoryNames.length-1), //代表地方报
                "categoryId": categoryIds.substring(0,categoryIds.length-1),//代表地方报id
                "column": jsonArr
            }
        })
        return json;
    };


    /*
     * 弹出层
     */
    function openWin(targetName){
        $(targetName).fadeIn(200);
        var coverHeight = $(document).height();
        var winHeight = $(window).height();
        var boxWidth = $(targetName).width();
        var boxHeight = $(targetName).height();
        function yAxis(){
            $('body').append("<div class='winCover'></div>");
            $(targetName).css({'margin-left':-(boxWidth/2),'top':winHeight/2-boxHeight/2});
            $('.winCover').css('height',coverHeight);
        };
        yAxis();
    };

    /*
     * 保存版面
     */
    $(".save-displace").on("click",function() {
        saveChangeLayoutAll();
    });

    /*
     * 关闭弹出层
     */
    $('.winBox').on("click",".close-layer",function () {
        $('.winCover').remove();
        $('.winBox').hide();
    });

    /*
     * 添加置换版--大
     */
    $("#displace-box").on("click",".add-displace-big",function(){
        var displace = "";
        displace+='<div class="displace-big">'
        displace+='<div class="displace-title">'
        displace+='<span class="news-paper-name">广州日报</span>'
        displace+='<span class="paper-name">版面名称</span>'
        displace+='<a class="del-paper" href="javascript:;">×</a>'
        displace+='</div>'
        displace+='<div class="displace-list clearfix">'
        displace+='<a class="left-btn" href="javascript:;">左</a>'
        displace+='<a class="right-btn" href="javascript:;">右</a>'
        displace+='<div class="scrollBox">'
        displace+='<ul class="displaces">'
        displace+='<a class="add-displace" href="javascript:;"><i class="add-icon">+</i>添加置换</a>'
        displace+='</ul>'
        displace+='</div>'
        displace+='</div>'
        displace+='</div>'
        $("#displace-box").prepend(displace);

    });

    //选择版面
    $("#displace-box").on("click",".paper-name",function(){
        openWin($(".papers-layer"));
        var curPaperNode = $(this);

        var temp2 = ',';
        var PaperNodes2 = '';

        $(".paper-name").each(function () {
            temp2 = temp2 + $(this).text() + ",";
        });


        papersLayer.find(".item").each(function(){
            $(this).removeClass("radiohide");
            if(temp2.indexOf(","+$(this).text()+",") > -1 ){
                $(this).addClass("radiohide");
                PaperNodes2 = $(this);
            }
        });

        $(".columnradio").unbind('click').on("click",function () {
            var thisPaperName = $(this).attr("name");
            curPaperNode.text(thisPaperName);
            curPaperNode.attr("layoutid",$(this).attr("layoutid"))
            $('.winCover').remove();
            $('.winBox').hide();
            papersLayer.find(".columnradio").attr('checked', false);
            $(this).parents(".item").addClass("radiohide");
        })
    });

    //选择地方报
    $("#displace-box").on("click",".selectpaper",function () {
        openWin($(".categroy-layer"));
        var curPaperNode = $(this);

        var temp = ',';
        var PaperNodes = '';

        $(".selectpaper").each(function () {
            temp = temp + $(this).text() + ",";
        });


        categoryLayer.find(".item").each(function(){
            $(this).removeClass("radiohide");
            if(temp.indexOf(","+$(this).text()+",") > -1 ){
                $(this).addClass("radiohide");
                PaperNodes = $(this);
            }
        });

        $(".columnradio").unbind('click').on("click",function () {
            var thisPaperName = $(this).attr("name");
            $(this).parents(".item").removeClass("radiohide");
            curPaperNode.attr("entry_ID",$(this).attr("entry_ID"));
            curPaperNode.attr("entry_CODE",$(this).attr("entry_CODE"));
            curPaperNode.attr("name",$(this).attr("name"));

            curPaperNode.text(thisPaperName);

            $('.winCover').remove();
            $('.winBox').hide();

            categoryLayer.find(".columnradio").attr('checked', false);
            $(this).parents(".item").addClass("radiohide");
        });
    });

    //选择栏目
    $("#displace-box").on("click",".select-displace-column",function() {
        var curCoulumnNode = $(this);
        var columns2 = ','
        var colNode2 = '';

        $(".select-displace-column").each(function () {
            columns2 = columns2 + $(this).text() + ",";
        });


        columnsLayer.find(".item").each(function () {
            $(this).removeClass("radiohide");
            if (columns2.indexOf("," + $(this).text() + ",") > -1) {
                $(this).addClass("radiohide");
                colNode2 = $(this);
            }
        });

        openWin($(".columns-layer"));
        columnsLayer.find(".columnradio").unbind('click').on("click", function () {
            var thisPaperName = $(this).attr("name");
            curCoulumnNode.text(thisPaperName);
            curCoulumnNode.attr("columnid",$(this).attr("columnid"));
            curCoulumnNode.addClass("columtext");
            curCoulumnNode.next(".select-displace-column").removeClass("hide");
            $('.winCover').remove();
            $('.winBox').hide();
            columnsLayer.find(".columnradio").attr('checked', false);
            columnsLayer.find(".item").removeClass("radiohide");
            $(this).parents(".item").addClass("radiohide");
        });

    });

    //添加置换版--小
    $("#displace-box").on("click",".add-displace", function(){
        var displace = '';
        displace+='<li class="displace-item">'
        displace+='<div class="displace-list-top clearfix">'
        displace+='<a class="selectpaper" href="javascript:;">选择地方报</a>'
        displace+='<span><img src="images/ad.png" class="ad-icon"> 2.5</span>'
        displace+='</div>'
        displace+='<a href="javascript:;" class="select-displace-column">选择栏目</a>'
        displace+='<a href="javascript:;" class="select-displace-column hide">选择栏目</a>'
        displace+='<a href="javascript:;" class="select-displace-column hide">选择栏目</a>'
        displace+='</li>'

        if(categoryLayer.find(".item").length == $(".displaces").find(".displace-item").length){
            alert("地方报已经添加完。")
        }else{
            $(this).before(displace);
            $(this).parents(".displaces").width($(this).parents(".displaces").find(".displace-item").size()*157+157);
            if($(this).parents(".displaces").find(".displace-item").length>=6){
                $(".left-btn").show();
                $(".right-btn").show();
            }
        }
    });

    //删除置换版
    $("#displace-box").on("click",".del-paper",function (){
        $(this).parents(".displace-big").remove();
    });

    var $cur = 1; //初始化显示的版面
    var $i= 1; //每版显示数
    var $len = $('.scrollBox .displace-item').length; //计算列表总长度(个数)
    var $pagecount = Math.ceil($len / $i); //计算展示版面数量
    var $showbox = $('.scrollBox');
    var $w = $('.scrollBox').width(); //取得展示区外围宽度

    $(".displace-box").on("click",".left-btn",function (){alert(1)
        //$(this).parents(".displace-list ").find(".displaces").animate({"margin-left":-a+"px"})
        /*var v_wrap = $(this).parents(".displace-list"); // 根据当前点击的元素获取到父元素
        var v_show = v_wrap.find(".displaces"); //找到视频展示的区域
        var v_cont = v_wrap.find(".displaces"); //找到视频展示区域的外围区域
        var v_width = v_cont.width();
        var len = v_show.find("displace-item").length; //我的视频图片个数
        var page_count = Math.ceil(len/i); //只要不是整数，就往大的方向取最小的整数
        var move_width = v_width/i;  //移动距离不是一个box的宽度了，一个box里显示4个li，一次移动一个li，所以移动距离除以4
        click_time ++;   //点击一次click_time++
        if(!v_show.is(":animated")){
            if(page == 1){
                v_show.animate({left:'-='+ v_width*(page_count-1)},"slow");
                page =page_count;
            }else{
                v_show.animate({left:'+='+ move_width},"slow");
                page--;
            }
        }*/

        if (!$showbox.is(':animated')) { //判断展示区是否动画
            if ($cur == 1) {}
            else {
                    $showbox.animate({
                        left: '+=' + $w
                    }, 600); //改变left值,切换显示版面
                    $cur--; //版面累减
                }
            }
     });

    $(".displace-box").on("click",".right-btn",function (){
        if (!$showbox.is(':animated')) {
            if ($cur == $pagecount) { }
            else {
                    $showbox.animate({
                        left: '-=' + $w
                    }, 600); //改变left值,切换显示版面
                    $cur++; //版面数累加
                }
            }

        //$(this).parents(".displace-list ").find(".displaces").animate({"margin-left":b+"px"})
        /*var v_wrap = $(this).parents(".displace-list"); // 根据当前点击的元素获取到父元素
        var v_show = v_wrap.find(".displaces"); //找到视频展示的区域
        var v_cont = v_wrap.find(".displaces"); //找到视频展示区域的外围区域
        var v_width = v_cont.width();
        var len = v_show.find("displace-item").length; //我的视频图片个数
        var page_count = Math.ceil(len/i); //只要不是整数，就往大的方向取最小的整数
        var move_width = v_width/i-27;  //移动距离不是一个box的宽度了，一个box里显示4个li，一次移动一个li，所以移动距离除以4

        console.log(move_width)
        click_time ++;   //点击一次click_time++
        if(!v_show.is(":animated")){
            if(page == page_count){
                v_show.animate({left:'0px'},"slow");
                page =1;
            }else{
                v_show.animate({left:'-='+move_width},"slow");  //移动距离进行了修改
                if(click_time == i){      //当click_time等于每页次数的时候 进行page++
                    page++;
                    click_time = 0;
                }
            }
        }*/
    });

})