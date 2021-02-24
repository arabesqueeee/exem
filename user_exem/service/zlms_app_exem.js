
function queryCurriculum(req, res) {
	try {
		var superid = req.query.super;

		if (superid == undefined || superid == null) {
			result = {
				status: "error",
				errmsg: "supervisor is is empty"
			};
			return result;;

		} else {
			var query = 'select * FROM   "ZSCH_ODATA"."ZTAB_LMS_EXE_LEARNING_PLAN" ' +
				'where SUPER = \'' +
				superid + '\' and  SC_RTYP_ID = \'01\'   and  ( EXEMPTION is null or EXEMPTION = \'\' ) ' +
				'and  ( COMPL_DTE is null or  COMPL_DTE = \'\') ' + 'order by stud_id,QUAL_ID,SUB_RECORD_LRNGEVT desc ';
			return query;
		}
	} catch (err) {
		// $.response.contentType = "text/plain";
		result.status = "error";
		result.code = err.toString();
		return result;
	}
}
function queryProgram(req, res) {
	try {
		var superid = req.query.super;

		if (superid == undefined || superid == null) {
			result = {
				status: "error",
				errmsg: "supervisor is is empty"
			};
			return result;;

		} else {

			var query = 'select * FROM "ZSCH_ODATA"."ZTAB_LMS_EXE_PROGRAM_STATUS"	' +
				'where   SUPER = \'' + superid + '\' and RTYP_ID = \'01\'   and ' +
				' ( EXEMPTION is null or EXEMPTION = \'\' ) and ( COMPL_DTE is null or COMPL_DTE = \'\' ) ' +
				'order by stud_id, PROGRAM_ID , SEQ_ORDER, SUB_RECORD_LRNGEVT DESC  ';

			return query;
		}
	} catch (err) {
		// $.response.contentType = "text/plain";
		result.status = "error";
		result.code = err.toString();
		return result;
	}
}
function updateCurriculum(req, res) {
	var obj = req.body;
	var componentID = obj.componentID,
		componentTypeID = obj.componentTypeID,
		studentID = obj.studentID;
	var completionDate = obj.completionDate;
	var com_ple = new Date(parseInt(completionDate));

	var curr_date = com_ple.getDate();
	var curr_month = com_ple.getMonth() + 1; //Months are zero based
	var curr_year = com_ple.getFullYear();
	var hours = com_ple.getHours();
	var minutes = com_ple.getMinutes();
	var comple = curr_year + "-" + curr_month + "-" + curr_date + " " + hours + ":" + minutes + ":00";
	//read fisrt then update
	var updatequery = 'UPDATE "ZSCH_ODATA"."ZTAB_LMS_EXE_LEARNING_PLAN" ' +
		'SET EXEMPTION =\'X\' , COMPL_DTE =\'' + comple + '\' where STUD_ID = \'' +
		studentID + '\' and  SC_CPNT_ID = \'' +
		componentID + '\' and SC_CPNT_TYP_ID = \'' +
		componentTypeID +
		'\' and SUB_RECORD_LRNGEVT = \'Y\' and ( COMPL_DTE is null or  COMPL_DTE = \'\') ';
	return updatequery;
}
function updateProgram(req, res) {
	var componentID = obj.componentID,
		componentTypeID = obj.componentTypeID,
		studentID = obj.studentID;
	var completionDate = obj.completionDate;
	var com_ple = new Date(parseInt(completionDate));

	var curr_date = com_ple.getDate();
	var curr_month = com_ple.getMonth() + 1; //Months are zero based
	var curr_year = com_ple.getFullYear();
	var hours = com_ple.getHours();
	var minutes = com_ple.getMinutes();
	var comple = curr_year + "-" + curr_month + "-" + curr_date + " " + hours + ":" + minutes + ":00";
	//read fisrt then update
	var updatequery = 'UPDATE "ZSCH_ODATA"."ZTAB_LMS_EXE_PROGRAM_STATUS" ' +
		'SET EXEMPTION =\'X\' , COMPL_DTE =\'' + comple + '\' where STUD_ID = \'' +
		studentID + '\' and  CPNT_ID = \'' +
		componentID + '\' and CPNT_TYP_ID = \'' +
		componentTypeID +
		'\' and SUB_RECORD_LRNGEVT = \'Y\' and  ( COMPL_DTE is null or  COMPL_DTE = \'\')';

	return updatequery;
}
module.exports = {
	queryCurriculum,
	queryProgram,
	updateCurriculum,
	updateProgram
}
