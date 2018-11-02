$(function () {
    //测试远程修改本地获取
    var papersLayer = $("#papers-layer");//版面弹出层
    var columnsLayer = $("#columns-layer");//版面弹出层

    $('#test>li').each(function(){
        if($('#test>li').length==0){return false;}
        $('#test>li:lt(4)').wrapAll('<ul></ul>');
    });

    //加载版面数据
    getPaperList("js/getPaperLayoutTreeList.json",papersLayer);

    //加载栏目数据
    getColumnList("js/getAllPaperColumnInfo.json",columnsLayer);


     /*
     * 获取当前日期
     */
    function getNowFormatDate(){
        var data = new Date();
        var CurrentDate = "";
        //初始化时间
        var Year = data.getFullYear();//ie火狐下都可以
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
            getPaperPlanData($(".choose-time").val(),1);
        },
    });
    $.datetimepicker.setLocale('ch');//设置中文格式
    $(".choose-time").val(nowDate);//设置默认时间

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
                otherParam: ["paperId", 1, "paperDate", "2017-07-18"],
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

    initLayoutTree();


    /*
    * 获取版面数据
    */
    function getPaperList(url,box) {
        $.ajax({
            url:url,
            type: "get",
            dataType: "json",
            data: {
                paperId:"1",
                paperDate:"2017-07-21"
            },
            success: function (data) {
                var result = "";
                for(var i=0;i<data.length;i++){
                    result +="<ul class='papers-layer-ul clearfix'>";
                    for(var t=0;t<data[i].length;t++){
                        result +="<li class='item'><label><input type='radio' class='columnradio' name='"+data[i][t].name+"'>"+data[i][t].name+"</label></li>";
                    }
                    result +="</ul>";
                }
                box.append(result);
            },
            error:function () {
                console.log(2)
            }
        });
    };

     /*
     * 获取栏目数据
     */
    function getColumnList(url,box) {
        $.ajax({
            url:url,
            type: "get",
            dataType: "json",
            data: {
                paperId:"1"
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
     * 保存版面规划
     */
    function savePaperPlanData() {
        $.ajax({
            url:"js/savePaperPlanData.json",
            type: "get",
            dataType: "json",
            data: {
                paperDate:nowDate,
                paperId:"1",
                paperPlanJson:JSON.stringify(GetPaperJson())
            },
            success: function (data) {
                alert(nowDate)
            },
            error:function () {
            }
        });
    };

    /*
     * 版面规划paperPlanJson数据
     */
    function GetPaperJson() {
        var json = [];
        $(".paper-small").each(function(index){
            var columnNames = "";
            var columnIds = "";

            $(this).find(".columtext").each(function(){
                columnNames+=$(this).text()+",";
                columnIds+=$(this).attr("columnid")+",";
                //columnNamesEd = columnNames.substring(0,columnNames.length - 1);
                columnIdsEd = columnIds.substring(0,columnIds.length - 1);


            })
            //console.log(arrays)
            json[index]={
                "categoryName": $(this).find(".select-paper-add").text(),
                "layoutName": "1版",
                "categoryId": "",
                "columnName":columnNames,
                "layoutId": 2,
                "columnId": columnIdsEd,
                "paperPlanPage": 1,
                "layoutCode": $(this).attr("layoutcode")
            }
        })
        return json;
    };



     /*
     * 获取版面规划数据
     */
    function getPaperPlanData(paperDate,paperId) {
        $.ajax({
            url:"js/getPaperPlanData.json",
            type: "get",
            dataType: "json",
            data: {
                paperDate:paperDate,
                paperId:paperId
            },
            success: function (data) {
                var html ="";
                for(var i=0;i<data.length;i++){
                    var coulumnArr = data[i].columnName.split(",");
                    var columnIdArr = data[i].columnId.split(",");
                    html+='<div class="paper-small" layoutCode="'+data[i].layoutCode+'">'
                        html+='<div class="paper-small-top">'
                            html+='<span class="select-paper-add">'+data[i].layoutName+'</span>'
                            html+='<a href="javascript:;" class="select-paper">+选择版面</a>'
                        html+='</div>'
                        html+='<div class="paper-small-bottom">'
                    if(coulumnArr==""){
                        html+='<div class="add-column-box">'
                        html+='<a href="javascript:;" class="add-column-btn btn-big">+</a>'
                        html+='</div>'
                    }else{
                        for(var c=0;c<coulumnArr.length;c++){
                            html+='<div class="add-column-box">'
                            html+='<a href="javascript:;" class="add-column-btn btn-big columtext" columnId='+columnIdArr[c]+'>'+coulumnArr[c]+'</a>'
                            html+='</div>'

                        }
                        if(c==1){
                            html+='<div class="add-column-box">'
                            html+='<a href="javascript:;" class="add-column-btn btn-big">+</a>'
                            html+='</div>'
                            html+='<div class="add-column-box hide">'
                            html+='<a href="javascript:;" class="add-column-btn btn-big">+</a>'
                            html+='</div>'
                        }else if(c==2){
                            html+='<div class="add-column-box">'
                            html+='<a href="javascript:;" class="add-column-btn btn-big">+</a>'
                            html+='</div>'
                        }
                    }
                    html+='</div>'
                    html+='<a href="" class="zhi-icon">置</a>'
                    html+='<a href="" class="ad-text">广</a>'
                    html+='</div>'
                }
                $("#paper-big-box").empty();
                $("#paper-big-box").append(html);

                //每4个div paper-small包含在一个li里
                $('#paper-big-box>.paper-small').each(function(index){
                    if($('#paper-big-box>.paper-small').length==0){return false;}
                    $('#paper-big-box>.paper-small:lt(4)').wrapAll('<li class="paper-big"></li>');
                });

                //第N张纸
                $('#paper-big-box .paper-big').each(function(index){
                    var ranks = index+1;
                    $(this).prepend("<p class='ranks'>第"+ranks+"张纸</p>")
                });

                //选择版面
                $(".select-paper").unbind('click').on("click",function(){
                    openWin($(".papers-layer"));
                    var curPaperNode = $(this).prev(".select-paper-add:last");

                    var temp = ',';
                    var PaperNodes = '';

                    $(".select-paper-add").each(function () {
                        temp = temp + $(this).text() + ",";
                    });


                    papersLayer.find(".item").each(function(){
                        $(this).removeClass("radiohide");
                        if(temp.indexOf(","+$(this).text()+",") > -1 ){
                            $(this).addClass("radiohide");
                            PaperNodes = $(this);
                        }
                    });

                    $(".columnradio").unbind('click').on("click",function () {
                        var thisPaperName = $(this).attr("name");
                        PaperNodes.removeClass("radiohide");
                        curPaperNode.text(thisPaperName);

                        $('.winCover').remove();
                        $('.winBox').hide();

                        papersLayer.find(".columnradio").attr('checked', false);
                        $(this).parents(".item").addClass("radiohide");
                    });
                });

                //选择栏目
                $(".add-column-btn").unbind('click').on("click",function(){
                    openWin($(".columns-layer"));
                    var curCoulumnNode = $(this);

                    var cols = ','
                    var colNode='';

                    $(".add-column-btn").each(function () {
                        cols = cols + $(this).text() + ",";
                    });


                    columnsLayer.find(".item").each(function(){
                        $(this).removeClass("radiohide");
                        if(cols.indexOf(","+$(this).text()+",") > -1 ){
                            $(this).addClass("radiohide");
                            colNode = $(this);
                        }
                    });

                    columnsLayer.find(".columnradio").unbind('click').on("click",function () {
                        var thisPaperName = $(this).attr("name");
                        curCoulumnNode.text(thisPaperName);
                        curCoulumnNode.parents(".add-column-box").next(".add-column-box").removeClass("hide")
                        $('.winCover').remove();
                        $('.winBox').hide();

                        columnsLayer.find(".columnradio").attr('checked', false);
                        columnsLayer.find(".item").removeClass("radiohide");
                        $(this).parents(".item").addClass("radiohide");
                    })
                });

            },
            error:function () {
            }
        });
    };
    getPaperPlanData(nowDate,1);


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
     * 关闭弹出层
     */
    $('.close-layer').on("click", function () {
        $('.winCover').remove();
        $('.winBox').hide();
    });


     /*
     * 添加纸张
     */
    $(".add-paper").on("click",function () {

        var data=""
        var myTemplate = Handlebars.compile($("#paper-big-temp").html());
        $("#paper-big-box").append(myTemplate(data));


        for(var i=0;i<$("#paper-big-box .paper-big").length;i++){
            var ranks= i+1;
            $("#paper-big-box .paper-big:last .ranks").text("第"+ranks+"张纸");
        }

        //选择栏目
        $(".add-column-btn").unbind('click').on("click",function(){
            var curCoulumnNode = $(this);
            var columns2 = ','
            var colNode2='';

            $(".add-column-btn").each(function () {
                columns2 = columns2 + $(this).text() + ",";
            });


            columnsLayer.find(".item").each(function(){
                $(this).removeClass("radiohide");
                if(columns2.indexOf(","+$(this).text()+",") > -1 ){
                    $(this).addClass("radiohide");
                    colNode2 = $(this);
                }
            });

            openWin($(".columns-layer"));
            columnsLayer.find(".columnradio").unbind('click').on("click",function () {
                var thisPaperName = $(this).attr("name");
                curCoulumnNode.text(thisPaperName);
                curCoulumnNode.attr("columnid",$(this).attr("columnid"))
                curCoulumnNode.addClass("columtext");
                $('.winCover').remove();
                $('.winBox').hide();
                columnsLayer.find(".columnradio").attr('checked', false);
                columnsLayer.find(".item").removeClass("radiohide");
                $(this).parents(".item").addClass("radiohide");
                curCoulumnNode.parents(".add-column-box").next(".add-column-box").removeClass("hide");
            })
        });


        //选择版面
        $(".select-paper").unbind('click').on("click",function(){
            openWin($(".papers-layer"));
            var curPaperNode = $(this).prev(".select-paper-add:last");
            var curPaperNodeText = curPaperNode.text();

            var temp2 = ',';
            var PaperNodes2 = '';

            $(".select-paper-add").each(function () {
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
                $('.winCover').remove();
                $('.winBox').hide();
                papersLayer.find(".columnradio").attr('checked', false);
                $(this).parents(".item").addClass("radiohide");
            })
        });
    });

     /*
     * 保存版面
     */
    $("#savePaperPlanData").on("click",function() {
        savePaperPlanData();
    });




    /*
     * 版面置换-添加置换版
     */
    $(".add-displace-big").on("click",function(){
        var displace = "";
        displace+='<div class="displace">'
        displace+='<div class="displace-title">广州日报 A1版</div>'
        displace+='<div class="displace-list clearfix">'
        displace+='<ul id="displaces">'
        displace+='</ul>'
        displace+='<a class="add-displace" href="javascript:;"><i class="add-icon">+</i>添加置换</a>'
        displace+='</div>'
        displace+='</div>'
        $("#displace-box").prepend(displace);

        /*
         * 添加置换版
         */
        $(".add-displace").on("click",function(){
            var displace = '';
            displace+='<li class="displace-item">'
            displace+='<div class="displace-list-top clearfix">'
            displace+='<div class="selectpaper-box">'
            displace+='<a class="selectpaper">中山日报</a>'
            displace+='<div class="paperbox">'
            displace+='<ul>'
            displace+='<li>123</li>'
            displace+='</ul>'
            displace+='</div>'
            displace+='</div>'
            displace+='<span class="adbox"><img src="images/ad.png" class="ad-icon"> 2.5</span>'
            displace+='</div>'
            displace+='<a href="#" class="select-displace-column">选择栏目</a>'
            displace+='<a href="#" class="select-displace-column ">选择栏目</a>'
            displace+='</li>'
            $("#displaces").append(displace);

            //选择地方报
            $(".selectpaper").on("click",function () {
                //$(this).parents(".selectpaper-box").find(".selectpaper-box").show();
                $(this).parents(".selectpaper-box").find(".paperbox").show();
            })
            //选择栏目
            $(".select-displace-column").unbind('click').on("click",function() {
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
                    curCoulumnNode.addClass("columtext");
                    $('.winCover').remove();
                    $('.winBox').hide();
                    columnsLayer.find(".columnradio").attr('checked', false);
                    columnsLayer.find(".item").removeClass("radiohide");
                    $(this).parents(".item").addClass("radiohide");
                    //curCoulumnNode.parents(".add-column-box").next(".add-column-box").removeClass("hide");
                });

            });

            //选择版面
            $(".displace-title").unbind('click').on("click",function(){
                openWin($(".papers-layer"));
                var curPaperNode = $(this).prev(".select-paper-add:last");

                var temp2 = ',';
                var PaperNodes2 = '';

                $(".displace-title").each(function () {
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
                    $('.winCover').remove();
                    $('.winBox').hide();
                    papersLayer.find(".columnradio").attr('checked', false);
                    $(this).parents(".item").addClass("radiohide");
                })
            });

        });


    });

    /*
     * 版面置换-保存
     */
    $(".save-displace").on("click",function(){

    })

    /*
     * 版面置换-选择栏目
     */
    $(".select-displace-column").on("click",function(){
        openWin(".columns-layer");
    });


    /*
     * 版面置换-选择栏目
     */
    $(".select-displace-column").on("click",function(){
        openWin(".columns-layer");
    });

})
