/* eslint-disable no-unused-vars */
/* eslint-disable no-debugger */
sap.ui.define([
  "com/tsmc/exem/controller/BaseController",
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/Filter",
  "sap/ui/core/Element",
  "sap/m/MessageView",
  "sap/m/MessagePopoverItem",
  "sap/m/Dialog",
  "sap/m/Bar",
  "sap/m/Button",
  "sap/m/Text"
// eslint-disable-next-line no-unused-vars
], function(Controller, JSONModel, Filter, Element, MessageView, MessagePopoverItem, Dialog, Bar,Button,Text) {
  "use strict";

  return Controller.extend("com.tsmc.exem.controller.App", {
    onInit(){
        this.byId("multi").setLimit(0);
        this.initData();
        //set footer invisible
        this.onDecline();
    },

    onSubmit: function(){
        var i18n = this.getView().getModel("i18n").getResourceBundle();
       var submit =  i18n.getText("submiting");

      var dialog = new sap.m.BusyDialog({
      text: submit
      });
      var postBody = {
        "recordLearningEvents": ""
      };
       var pieceArr = [];
      //get selected item and call learning api to process
       var aIndices = this.byId("courselist1").getPlugins()[0].getSelectedIndices()
      var tableData  = [];
      var context = this.byId("courselist1").getBinding('rows').getContexts();
      for (var ii=0;ii<context.length;ii++)
      {
         var rowData = this.byId("courselist1").getModel("dataModel").getProperty(context[ii].sPath);
         tableData.push(rowData);
      }

      if (aIndices.length<1){
          sap.m.MessageToast.show(i18n.getText("tip1"));
      } else if (aIndices.length>100){
          sap.m.MessageToast.show(i18n.getText("tip2"));
      } else {
        dialog.open();
        var timestamp = Date.parse(new Date());
        timestamp = timestamp - 6000;
        for ( var i=0; i<aIndices.length; i++) {
          //allowed and new
          if (tableData[aIndices[i]].SUB_RECORD_LRNGEVT == "Y" &&
             tableData[aIndices[i]].EXEMPTION == "" &&
             tableData[aIndices[i]].SIGN !== "X" // exclude tip row
          ){
            //concatenate api
            var piece = {};

            piece.componentTypeID = tableData[aIndices[i]].CPNT_TYP_ID;
            piece.componentID = tableData[aIndices[i]].CPNT_ID;
            piece.studentID = tableData[aIndices[i]].STUD_ID;
            piece.completionStatusID =  tableData[aIndices[i]].CPNT_TYP_ID + "06"; //complete status 06
            piece.completionDate = timestamp;
            //1 Item（單元課程）2 Program（學程）3 Curriculum（復合課程）
            if (tableData[aIndices[i]].CPNT_SOUR_TYP == "Program（學程）"){
              piece.comments = "Y";
            } else {
              piece.comments = "X";
            }
            pieceArr.push(piece);
          }
        }
        if (pieceArr.length > 0){
           postBody.recordLearningEvents = pieceArr;
           var postJson = JSON.stringify(postBody);
           var that = this;
        //call api
         $.ajax({
                     url: "/sendgrade_wt",
                     method: "POST",
                     contentType: "application/json",
                     data: postJson,
                     // eslint-disable-next-line no-unused-vars
                     success: function(_data) {
                      // update model to display result
                      // eslint-disable-next-line no-debugger
                      debugger;
                      var tableError =[];
                      for (var j=0;j<_data.recordLearningEvents.length;j++){
                        // eslint-disable-next-line no-debugger
                        debugger;
                        if (_data.recordLearningEvents[j].errorMessage == null){
                            sap.m.MessageToast.show(i18n.getText("tip3"));
                            debugger;
                            var updatedb = {};
                            updatedb.componentID = _data.recordLearningEvents[j].componentID;
                            updatedb.componentTypeID =  _data.recordLearningEvents[j].componentTypeID,
                            updatedb.studentID = _data.recordLearningEvents[j].studentID;
                            updatedb.completionDate =  _data.recordLearningEvents[j].completionDate;
                            updatedb.comments =  _data.recordLearningEvents[j].comments;
                            var postdb = JSON.stringify(updatedb);
                            if (updatedb.comments == "X"){
                              //更新成功,更新数据并回写
                              $.ajax({
                               url: "/xsjs/exem/userlearning_hdb.xsjs",
                               method: "POST",
                               contentType: "application/json",
                               data: postdb,
                             success: function() {
                              //remove sucessful data
                             that.getView().byId("courselist1").getBinding().refresh(true);
                            }
                           })
                            } else {
                              //更新成功,更新数据并回写
                              debugger;
                              $.ajax({
                               url: "/xsjs/exem/programstatus_hdb.xsjs",
                               method: "POST",
                               contentType: "application/json",
                               data: postdb,
                             success: function() {
                                    //remove sucessful data
                             that.getView().byId("courselist1").getBinding().refresh(true);
                            }
                         })
                        }
                           dialog.close();
                           that.initData();

                        } else
                        {
                           dialog.close();

                           debugger;
                         //  sap.m.MessageToast.show(_data.recordLearningEvents[j].errorMessage);

                         tableError.push( _data.recordLearningEvents[j]);
                        }
                      }
                      that.messDisplay(tableError);

                    },
                     error: function()
                     {
                     sap.m.MessageToast.show(i18n.getText("tip4"));
                       dialog.close();
                       /*dummy data
                       var testerror={}, tableError =[];
                       testerror.errorMessage = "Completion date can not be in future";
                       testerror.componentTypeID= "01";
                       testerror.componentID = "1";
                       testerror.studentID = "LMSADMIN";
                       tableError.push(testerror);
                       that.messDisplay(tableError);
                       */
                                             }

                      });
        } else {
           sap.m.MessageToast.show(i18n.getText("tip1"));
        }

      }

    },
 uniqueJsonArray (array, key){
    var result = [array[0]];
    for (var i = 1; i < array.length; i++){
        var item = array[i];
        var repeat = false;
        for (var j = 0; j < result.length; j++) {
            if (item[key] == result[j][key]) {
                repeat = true;
                break;
            }
        }
        if (!repeat) {
            result.push(item);
        }
    }
    return result;
},
handleConfirm: function(oEvent){
  var oFacetFilter;
  if (oEvent !== undefined){
  oFacetFilter = oEvent.getSource();
  } else {
    oFacetFilter = this.byId("idFacetFilter1");
  }

	 		this._filterModel(oFacetFilter);
},
	_filterModel: function(oFacetFilter) {
			var mFacetFilterLists = oFacetFilter.getLists().filter(function(oList) {
				return oList.getSelectedItems().length;
			});

			if (mFacetFilterLists.length) {
				// Build the nested filter with ORs between the values of each group and
				// ANDs between each group
				var oFilter = new Filter(mFacetFilterLists.map(function(oList) {
					return new Filter(oList.getSelectedItems().map(function(oItem) {
						return new Filter(oList.getKey(), "EQ", oItem.getText());
					}), false);
				}), true);
				this._applyFilter(oFilter);
			} else {
				this._applyFilter([]);
			}
    },
		_applyFilter: function(oFilter) {
			// Get the table (last thing in the VBox) and apply the filter
			var	oTable =  this.getView().byId("courselist1");
       oTable.getBinding().filter(oFilter);
       var len = this.byId("courselist1").getBinding('rows').getContexts().length;
       this.byId("courselist1").setVisibleRowCount(len);
      //   this.addColor();

     // oTable.getBinding().refresh(true);
    },
    // eslint-disable-next-line no-unused-vars
    rowSelectionChange: function(oEvent){

    },
		handleFacetFilterReset: function(oEvent) {

			var oFacetFilter = Element.registry.get(oEvent.getParameter("id")),
				aFacetFilterLists = oFacetFilter.getLists();

			for (var i = 0; i < aFacetFilterLists.length; i++) {
				aFacetFilterLists[i].setSelectedKeys();
			}

			this._applyFilter([]);
    },
   initData: function (){
      var i18n = this.getView().getModel("i18n").getResourceBundle();
       var loading = i18n.getText("loading");
      var dialog = new sap.m.BusyDialog({
      text: loading
  });
  dialog.open();
      //define table structure
        var totalData =[];
        var arrUserId = [], arrSourceType = [], filters={}, arrFilters=[];
        var arrId =[], arrExem=[];
        var that = this;
        var filUserId = this.getView().getModel("i18n").getResourceBundle().getText("filUserId");
        var filSorceType = this.getView().getModel("i18n").getResourceBundle().getText("filSorceType");
        var filCourseId = this.getView().getModel("i18n").getResourceBundle().getText("filCourseId");
        var filExem = this.getView().getModel("i18n").getResourceBundle().getText("filExem");

         var  newAnApp = function (oItem) {
                      var oNewApp = {
                         CPNT_SOUR_TYP: "",
                         ACT_CPNT_ID: "",
                         CPNT_TITLE_TW: "",
                         CPNT_SOUR_SUBTYPID: "",
                         STUD_ID: "",
                         NAME: "",
                         CPNT_SOUR_SUBTYP: "",
                         REQU_DATE: "",
                         SUB_RECORD_LRNGEVT: "",
                         EXEMPTION: "",
                         LST_UPD_USR: "",
                         CPNT_TYP_ID: "",
                         CPNT_ID: "",
                      };
                       if (oItem.QUAL_ID == null){
                        oNewApp.CPNT_SOUR_TYP = "Item（單元課程）";
                        oNewApp.ACT_CPNT_ID = oItem.SC_CPNT_ID;
                        oNewApp.CPNT_TITLE_TW = oItem.CPNT_TITLE_TW;
                        oNewApp.STUD_ID = oItem.STUD_ID;
                        oNewApp.NAME = oItem.LNAME + oItem.FNAME;
                        oNewApp.REQU_DATE = oItem.REQ_DTE;
                        oNewApp.CPNT_TYP_ID =oItem.SC_CPNT_TYP_ID;
                        oNewApp.CPNT_ID = oItem.SC_CPNT_ID;
                        oNewApp.SUB_RECORD_LRNGEVT = oItem.SUB_RECORD_LRNGEVT;
                        oNewApp.SIGN = "";
                      } else {
                        oNewApp.CPNT_SOUR_TYP = "Curriculum（復合課程）";
                        oNewApp.ACT_CPNT_ID = oItem.QUAL_ID;
                        oNewApp.CPNT_TITLE_TW = oItem.QUAL_TITLE_TW;
                        oNewApp.STUD_ID = oItem.STUD_ID;
                        oNewApp.NAME = oItem.LNAME + oItem.FNAME;
                        oNewApp.REQU_DATE = oItem.REQ_DTE;
                        oNewApp.CPNT_TYP_ID =oItem.SC_CPNT_TYP_ID;
                        oNewApp.CPNT_ID = oItem.SC_CPNT_ID;
                        oNewApp.SUB_RECORD_LRNGEVT = oItem.SUB_RECORD_LRNGEVT;
                        oNewApp.SIGN = "";
                      }
                      return oNewApp;
                  };
                   var  newAnPro = function (oItem) {
                      var oNewApp = {
                         CPNT_SOUR_TYP: "",
                         ACT_CPNT_ID: "",
                         CPNT_TITLE_TW: "",
                         CPNT_SOUR_SUBTYPID: "",
                         STUD_ID: "",
                         NAME: "",
                         CPNT_SOUR_SUBTYP: "",
                         REQU_DATE: "",
                         SUB_RECORD_LRNGEVT: "",
                         EXEMPTION: "",
                         LST_UPD_USR: "",
                         CPNT_TYP_ID: "",
                         CPNT_ID: "",
                      };
                      if (oItem.RTYP_ID=="1"){
                        oNewApp.CPNT_SOUR_TYP = "Program（學程）";
                        oNewApp.ACT_CPNT_ID = oItem.PROGRAM_ID;
                        oNewApp.CPNT_TITLE_TW = oItem.PROGRAM_TITLE_TW;
                        oNewApp.STUD_ID = oItem.STUD_ID;
                        oNewApp.NAME = oItem.LNAME + oItem.FNAME;
                        oNewApp.REQU_DATE = oItem.REQ_DTE;
                        oNewApp.CPNT_SOUR_SUBTYPID = oItem.SEQ_ORDER;
                        oNewApp.CPNT_SOUR_SUBTYP = oItem.PROGRAM_SECTION_TITLE_CN;
                        oNewApp.CPNT_TYP_ID = oItem.CPNT_TYP_ID;
                        oNewApp.CPNT_ID = oItem.CPNT_ID;
                        oNewApp.SUB_RECORD_LRNGEVT = oItem.SUB_RECORD_LRNGEVT;
                        oNewApp.SIGN = "";
                         return oNewApp;
                      }
                  };

                    $.ajax({
                     url: "/xsjs/exem/userlearning_hdb.xsjs?super=T000001",
                     method: "GET",
                     dataType: "json",
                     success: function(data) {

                      for (var i=0; i<data.length; i++){
                         var oNewApp = {};
                         oNewApp = newAnApp(data[i]);
                           var valueUserId ={};
                          valueUserId.data = oNewApp.STUD_ID;
                          valueUserId.text = filUserId;
                          arrUserId.push(valueUserId);
                          var valueSourceType ={};
                          valueSourceType.data = oNewApp.CPNT_SOUR_TYP;
                          valueSourceType.text = filSorceType;
                          arrSourceType.push(valueSourceType);
                          var valueId={};
                          valueId.data = oNewApp.ACT_CPNT_ID;
                          valueId.text = filCourseId;
                          arrId.push(valueId);
                          var valueExem={};
                          valueExem.data = oNewApp.SUB_RECORD_LRNGEVT;
                          valueExem.text = filExem;
                          arrExem.push(valueExem);
                         totalData.push(oNewApp);
                      }

                    $.ajax({
                     url: "/xsjs/exem/programstatus_hdb.xsjs?super=T000001",
                     method: "GET",
                     dataType: "json",
                     success: function(dataPro) {
                      for ( i=0; i<dataPro.length; i++){
                        //userlearning表中为Item和Curriculum
                        //1 Item（單元課程）2 Program（學程）3 Curriculum（復合課程）
                        //programstatus表中爲program
                          var oNewPro = {};
                         oNewPro = newAnPro(dataPro[i]);
                          valueUserId ={};
                          valueUserId.data = oNewPro.STUD_ID;
                          valueUserId.text = filUserId;
                          arrUserId.push(valueUserId);
                          valueSourceType ={};
                          valueSourceType.data = oNewPro.CPNT_SOUR_TYP;
                          valueSourceType.text =  filSorceType;
                          arrSourceType.push(valueSourceType);
                           valueId={};
                          valueId.data = oNewPro.ACT_CPNT_ID;
                          valueId.text = filCourseId;
                          arrId.push(valueId);
                          valueExem={};
                          valueExem.data = oNewPro.SUB_RECORD_LRNGEVT;
                          valueExem.text = filExem;
                          arrExem.push(valueExem);
                         totalData.push(oNewPro);

                      }
                     var afterTable =  that.processTable(totalData);

                      var _result = {
		                		courseSet: afterTable
                        };
                      var courseTableModel = new JSONModel(_result);

                      that.getView().byId("courselist1").setModel(courseTableModel,"dataModel");
                      that.getView().byId("courselist1").setVisibleRowCount(afterTable.length);
                      //对arrId和arrSourceType进行去重
                        arrUserId = that.uniqueJsonArray(arrUserId, "data");
                        arrSourceType = that.uniqueJsonArray(arrSourceType, "data");
                        arrId = that.uniqueJsonArray(arrId, "data");
                        arrExem = that.uniqueJsonArray(arrExem, "data");
                        filters.category = "STUD_ID";
                        filters.text =  filUserId;
                        filters.values = arrUserId;
                        arrFilters.push(filters);
                        filters={};
                        filters.category = "CPNT_SOUR_TYP";
                        filters.text = filSorceType;
                        filters.values = arrSourceType;
                        arrFilters.push(filters);
                        filters={};
                        filters.category = "ACT_CPNT_ID";
                        filters.text = filCourseId;
                        filters.values = arrId;
                        arrFilters.push(filters);
                        filters={};
                        filters.category = "SUB_RECORD_LRNGEVT";
                        filters.text = filExem;
                        filters.values = arrExem;
                        arrFilters.push(filters);
                        var _filterresult ={
                          filterSet: arrFilters
                        };
                        dialog.close();
                       var filterTableModel =  new JSONModel(_filterresult);
                      that.getView().byId("idFacetFilter1").setModel(filterTableModel, "filter");
                      that.addColorInit();
                      that.setDefaultFilter();

                  },
                     error: function()
                     {
                     sap.m.MessageToast.show("reading program error");
                     }
                  });
                  },
                     error: function()
                     {
                     sap.m.MessageToast.show("reading item error");
                     dialog.close();
                     }
              });
            //unselect item
        //    this.byId("courselist").setSelectedIndex(-1);
            // add color

           },
           groupBy: function(array, f) {
           const groups = {};
           array.forEach(function (o) {
           const group = JSON.stringify(f(o));
           groups[group] = groups[group] || [];
           groups[group].push(o);
  });
  return Object.keys(groups).map(function (group) {
    return groups[group];
  });
},
processTable: function(jsonArray){
  //sort by stud_id and ACT_CPNT_ID
var returnTable = [];
var sortStudId = this.groupBy(jsonArray, function (item) {
    return [item.STUD_ID];
  });
  for (var i=0;i<sortStudId.length;i++){
   var sortActCpntId = this.groupBy(sortStudId[i], function (item) {
    return [item.ACT_CPNT_ID];});
      // loop by ID
      for ( var j=0;j<sortActCpntId.length;j++){

          if (sortActCpntId[j][0].CPNT_SOUR_TYP=="Item（單元課程）"){
          //如果是单元课程则不增加一行
          for ( var h=0;h<sortActCpntId[j].length;h++)  {
          returnTable.push(sortActCpntId[j][h]);
         }
         } else {
          //push first then loop
          var nodeJson = {};
          nodeJson.STUD_ID = sortActCpntId[j][0].STUD_ID;
          nodeJson.NAME = sortActCpntId[j][0].NAME;
          nodeJson.CPNT_SOUR_TYP = sortActCpntId[j][0].CPNT_SOUR_TYP;
          nodeJson.ACT_CPNT_ID =  sortActCpntId[j][0].ACT_CPNT_ID;
          nodeJson.CPNT_TITLE_TW =  sortActCpntId[j][0].CPNT_TITLE_TW;
           nodeJson.SUB_RECORD_LRNGEVT =  sortActCpntId[j][0].SUB_RECORD_LRNGEVT;
          nodeJson.SIGN = "X";
          returnTable.push(nodeJson);
          for (  h=0;h<sortActCpntId[j].length;h++)  {
          returnTable.push(sortActCpntId[j][h]);
         }
        }

      }
  }
  return returnTable;
},
   addColor :function(){
    var oTable = this.getView().byId("courselist1");
     var tableData  = [];
      this.byId("courselist1").addStyleClass("rowColorGrey");
      var context = this.byId("courselist1").getBinding('rows').getContexts();
      for (var ii=0;ii<context.length;ii++)
      {
         var rowData = this.byId("courselist1").getModel("dataModel").getProperty(context[ii].sPath);
         tableData.push(rowData);
      }
    //oTable.addDelegate({
   // onAfterRendering: function() {
        for (var k = 0; k < tableData.length; k++) {
            if (tableData[k].SIGN == 'X') {
              var cellID = oTable.getRows()[k].getId();
               $("#" + cellID).css("background-color", "#D3D3D3");
            } else {
                  var cellID = oTable.getRows()[k].getId();
               $("#" + cellID).css("background-color", "white");
            }
        }
  //  }
//});
   },
    addColorInit :function(){
    var oTable = this.getView().byId("courselist1");
    var that = this;
    oTable.addDelegate({
    onAfterRendering: function() {
      var tableData  = [];
      var context = that.byId("courselist1").getBinding('rows').getContexts();
      for (var ii=0;ii<context.length;ii++)
      {
         var rowData = that.byId("courselist1").getModel("dataModel").getProperty(context[ii].sPath);
         tableData.push(rowData);
      }
      that.byId("courselist1").addStyleClass("rowColorGrey");
      var len = that.byId("courselist1").getBinding('rows').getContexts().length;
        for (var k = 0; k < len; k++) {
            if (tableData[k].SIGN == 'X') {
              var cellID = oTable.getRows()[k].getId();
               $("#" + cellID).css("background-color", "#D3D3D3");
            } else {
                  var cellID = oTable.getRows()[k].getId();
               $("#" + cellID).css("background-color", "white");
            }
        }
    }
});
   },

   onSelectionChange: function(oEvent){
      var i18n = this.getView().getModel("i18n").getResourceBundle();
      var oPlugin = oEvent.getSource();
      // eslint-disable-next-line no-unused-vars
      var customPayload = oEvent.getParameters().customPayload ;
      if ( customPayload == null){
      var iIndices = oPlugin.getSelectedIndices(); //已选中的
      var endIndices;
      var aIndices = oEvent.getParameters().rowIndices ; //点击的
     //  var aIndices = oPlugin.getSelectedIndices();
     var tableData  = [];
      var context = this.byId("courselist1").getBinding('rows').getContexts();
      for (var ii=0;ii<context.length;ii++)
      {
         var rowData = this.byId("courselist1").getModel("dataModel").getProperty(context[ii].sPath);
         tableData.push(rowData);
      }
       for (var i=0;i<1;i++){
        if (tableData[aIndices[i]].SUB_RECORD_LRNGEVT == "N" ||
          tableData[aIndices[i]].EXEMPTION == "X")
          {
            //remove selected row
          oPlugin.removeSelectionInterval(aIndices[i], aIndices[i]);
        sap.m.MessageToast.show(i18n.getText("tip5"));
        }
        if (tableData[aIndices[i]].SIGN == "X" ){
          //select subnode
          for (var j=0;j<tableData.length;j++){
              if (tableData[j].ACT_CPNT_ID == tableData[aIndices[i]].ACT_CPNT_ID
                && tableData[j].STUD_ID == tableData[aIndices[i]].STUD_ID
                &&  tableData[j].SUB_RECORD_LRNGEVT == "Y"
                ){
                endIndices = j;
              } else {
                continue;
              }
          }
          var obj = {};
          //判断为select or deselect
          if (oPlugin.isIndexSelected(aIndices[i])){
         //obj中添加需要已选中的list
          oPlugin.addSelectionInterval(aIndices[i], endIndices,obj );
          } else {
          oPlugin.removeSelectionInterval(aIndices[i], endIndices,obj );
          }
          //對爲N的unselect

        }
      }

    }
   },
   setDefaultFilter:function(){
        var selectedKeys = {};
        selectedKeys.Y="Y";
        this.byId("idFacetFilter1").getLists()[3].setSelectedKeys(selectedKeys);
        var filter=new Filter ("SUB_RECORD_LRNGEVT","EQ","Y");

        this._applyFilter(filter);
        this.handleConfirm();

   },
   messDisplay: function(errorArray){
    debugger;
       var i18n = this.getView().getModel("i18n").getResourceBundle();
       var reason =  i18n.getText("reason");
       var failed = i18n.getText("failed");
    	var oMessageTemplate = new MessagePopoverItem({
	  	type: '{type}',
	  	title: '{title}',
	   	description: '{description}'
	    });
    var aMockMessages  = [];
   	var mockMessage = { };
    var context = this.byId("courselist1").getBinding('rows').getContexts();
    for ( var jj=0;jj<errorArray.length;jj++){
         for (var ii=0;ii<context.length;ii++)
      {
         var rowData = this.byId("courselist1").getModel("dataModel").getProperty(context[ii].sPath);
        if ( rowData.STUD_ID == errorArray[jj].studentID  &&
            rowData.CPNT_TYP_ID == errorArray[jj].componentTypeID &&
            rowData.CPNT_ID ==  errorArray[jj].componentID ){
              	var mockMessage = { };
              mockMessage.type = 'Error';
              mockMessage.title = rowData.STUD_ID + " " + rowData.CPNT_SOUR_TYP + " "+ rowData.CPNT_TITLE_TW + " "
              + rowData.ACT_CPNT_ID
              + " " + rowData.CPNT_SOUR_SUBTYP
              + " " + failed ;
              mockMessage.description = reason + errorArray[jj].errorMessage ;

            aMockMessages.push(mockMessage);
        }
      }
    }
    if (aMockMessages.length>0){
       this.byId("ObjectPageLayout").setShowFooter(true);
    } else {
      return ;
    }
        var that = this;
        var oModel = new JSONModel();
		  	oModel.setData(aMockMessages);
      	var oBackButton = new Button({
				icon: sap.ui.core.IconPool.getIconURI("nav-back"),
				visible: false,
				press: function () {
					that.oMessageView.navigateBack();
					this.setVisible(false);
				}
			});

    	this.oMessageView = new MessageView({
					showDetailsPageHeader: false,
					itemSelect: function () {
						oBackButton.setVisible(true);
					},
					items: {
						path: '/',
						template: oMessageTemplate
					},
					groupItems: true
				});

			this.getView().setModel(oModel);
			this.getView().addDependent(this.oMessageView);
      var title =   i18n.getText("error");
      var close = i18n.getText("close");
			this.oDialog = new Dialog({
				content: this.oMessageView,
				contentHeight: "50%",
				contentWidth: "50%",
				endButton: new Button({
					text: close,
					press: function() {
						this.getParent().close();
					}
        }),

				customHeader: new Bar({
					contentMiddle: [
						new Text({ text: title})
					],
					contentLeft: [oBackButton]
				}),
				verticalScrolling: false
      });
      this.oMessageView = new MessageView({
					showDetailsPageHeader: false,
					itemSelect: function () {
						oBackButton.setVisible(true);
					},
					items: {
						path: '/',
						template: oMessageTemplate
					},
					groupItems: true
				});

			this.getView().setModel(oModel);
      this.getView().addDependent(this.oMessageView);

			this.oDialog = new Dialog({
				content: this.oMessageView,
				contentHeight: "50%",
				contentWidth: "50%",
				endButton: new Button({
					text: close,
					press: function() {
						this.getParent().close();
					}
				}),
				customHeader: new Bar({
					contentMiddle: [
						new Text({ text: title})
					],
					contentLeft: [oBackButton]
				}),
				verticalScrolling: false
			});

   },
   	buttonIconFormatter: function () {
			var sIcon;
			var aMessages = this.getView().getModel().oData;
			aMessages.forEach(function (sMessage) {
				switch (sMessage.type) {
					case "Error":
						sIcon = "sap-icon://message-error";
						break;
					case "Warning":
						sIcon = sIcon !== "sap-icon://message-error" ? "sap-icon://message-warning" : sIcon;
						break;
					case "Success":
						sIcon = "sap-icon://message-error" && sIcon !== "sap-icon://message-warning" ? "sap-icon://message-success" : sIcon;
						break;
					default:
						sIcon = !sIcon ? "sap-icon://message-information" : sIcon;
						break;
				}
			});

			return sIcon;
    },
    	handleMessageViewPress: function (oEvent) {
			this.oMessageView.navigateBack();
			this.oDialog.open();
		},
		// Display the number of messages with the highest severity
		highestSeverityMessages: function () {
			var sHighestSeverityIconType = this.buttonTypeFormatter();
			var sHighestSeverityMessageType;

			switch (sHighestSeverityIconType) {
				case "Negative":
					sHighestSeverityMessageType = "Error";
					break;
				case "Critical":
					sHighestSeverityMessageType = "Warning";
					break;
				case "Success":
					sHighestSeverityMessageType = "Success";
					break;
				default:
					sHighestSeverityMessageType = !sHighestSeverityMessageType ? "Information" : sHighestSeverityMessageType;
					break;
			}

			return this.getView().getModel().oData.reduce(function(iNumberOfMessages, oMessageItem) {
				return oMessageItem.type === sHighestSeverityMessageType ? ++iNumberOfMessages : iNumberOfMessages;
			}, 0);
    },
    	buttonTypeFormatter: function () {
			var sHighestSeverityIcon;
			var aMessages = this.getView().getModel().oData;

			aMessages.forEach(function (sMessage) {

				switch (sMessage.type) {
					case "Error":
						sHighestSeverityIcon = "Negative";
						break;
					case "Warning":
						sHighestSeverityIcon = sHighestSeverityIcon !== "Negative" ? "Critical" : sHighestSeverityIcon;
						break;
					case "Success":
						sHighestSeverityIcon = sHighestSeverityIcon !== "Negative" && sHighestSeverityIcon !== "Critical" ?  "Success" : sHighestSeverityIcon;
						break;
					default:
						sHighestSeverityIcon = !sHighestSeverityIcon ? "Neutral" : sHighestSeverityIcon;
						break;
				}
			});

			return sHighestSeverityIcon;
    },
    onDecline:function(){
        this.byId("ObjectPageLayout").setShowFooter(false);
    }
  });
});
