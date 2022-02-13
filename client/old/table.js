(function () {
	// Ref: http://www.labbookpages.co.uk/web/realtime.html
	window.addEventListener('load', function () {
		////////////////////////////////////// Table Creation - start /////////////////////////////////////////
		var key = 'events';

		function fun(obj, explore) {
			var targetObj = null;
			for (var prop in obj) {
				if (obj.hasOwnProperty(prop) && prop === explore && !!obj[prop] && typeof (obj[prop]) == "object") {
					targetObj = obj[prop];
					break;
				}
			}

			if (targetObj) {
				var keys = Object.keys(targetObj);
				var tableContent = [];

				for (var i = 0; i < keys.length; ++i) {
					var arrObjs = [];
					var tableName = keys[i];
					for (var p in targetObj[keys[i]]) {
						if (targetObj[keys[i]].hasOwnProperty(p)) {
							var x = targetObj[keys[i]][p];
							x.name = p;
							arrObjs.push(x);
						}
					}
					// generateDynamicTable(arrObjs, tableName);
					tableContent.push({
						"tableName": keys[i],
						"arrayOfObj": arrObjs
					});
				}
				generateDynamicTable(tableContent);
			}
		}

		function generateDynamicTable(tableContent) {

			// CREATE DYNAMIC TABLE.
			var table = document.createElement("table");
			table.style.width = '50%';
			table.setAttribute('border', '1');
			table.setAttribute('cellspacing', '0');
			table.setAttribute('cellpadding', '5');

			for (var count = 0; count < tableContent.length; ++count) {
				tableName = tableContent[count].tableName;
				myContacts = tableContent[count].arrayOfObj;
				var noOfContacts = myContacts.length;

				if (noOfContacts > 0) {
					var col = []; // define an empty array
					for (var i = 0; i < noOfContacts; i++) {
						for (var key in myContacts[i]) {
							if (col.indexOf(key) === -1) {
								col.push(key);
							}
						}
					}

					// CREATE TABLE HEAD .
					var tHead = document.createElement("thead");

					/////////////////////////////////////////////////////////
					var titleRow = document.createElement("tr");
					var th = document.createElement("th");
					th.innerHTML = tableName;
					titleRow.appendChild(th);
					tHead.appendChild(titleRow);
					table.appendChild(tHead);
					//////////////////////////////////////////////////////
					// CREATE ROW FOR TABLE HEAD .
					var hRow = document.createElement("tr");
					// ADD COLUMN HEADER TO ROW OF TABLE HEAD.
					for (var i = 0; i < col.length; i++) {
						var th = document.createElement("th");
						th.innerHTML = col[i];
						hRow.appendChild(th);
					}
					tHead.appendChild(hRow);
					table.appendChild(tHead);

					// CREATE TABLE BODY .
					var tBody = document.createElement("tbody");

					// ADD COLUMN HEADER TO ROW OF TABLE HEAD.
					for (var i = 0; i < noOfContacts; i++) {

						var bRow = document.createElement("tr"); // CREATE ROW FOR EACH RECORD .

						for (var j = 0; j < col.length; j++) {
							var td = document.createElement("td");
							td.innerHTML = myContacts[i][col[j]];
							bRow.appendChild(td);
						}
						tBody.appendChild(bRow)
					}
					table.appendChild(tBody);

					// document.body.appendChild(table);
				}
			}
			// FINALLY ADD THE NEWLY CREATED TABLE WITH JSON DATA TO A CONTAINER.
			var divContainer = document.getElementById("liveData");
			divContainer.innerHTML = "";
			divContainer.appendChild(table);
		}

		//////////////////////////////////////// Ajax - start //////////////////////////////////////////////////////////////////
		var xhr = null;

		getXmlHttpRequestObject = function () {
			if (!xhr) {
				// All modern browsers have a built-in XMLHttpRequest object to request data from a server
				// Create a new XMLHttpRequest object 
				xhr = new XMLHttpRequest();
			}
			return xhr;
		};

		updateLiveData = function () {
			var now = new Date();
			// Date string is appended as a query with live data for not to use the cached version 
			
			// Method 1: GET - send file ( file.json)
			var url = 'availableMatchEventList.json?' + now.getTime();
			xhr = getXmlHttpRequestObject();
			xhr.onreadystatechange = evenHandler;
			// asynchronous requests
			xhr.open("GET", url, true);	
			// Send the request over the network
			xhr.send(null);
			

			/*
			// Method 2: POST - send object( json object)
			xhr = getXmlHttpRequestObject();
			xhr.onreadystatechange = evenHandler;
			//xhr.open("POST", "/json-handler");
			var url = "hello";
			xhr.open("POST", url, true);
			xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
			//xhr.send(JSON.stringify({name:"John Rambo", time:"2pm"}));
			var data = JSON.stringify({
				"email": "tomb@raider.com",
				"name": "LaraCroft"
			});
			xhr.send(data);
			*/
		};

		updateLiveData();

		function evenHandler() {
			// Check response is ready or not
			if (xhr.readyState == 4 && xhr.status == 200) {
				// dataDiv = document.getElementById('liveData');
				// Set current data text
				// dataDiv.innerHTML = xhr.responseText;
				fun(JSON.parse(xhr.responseText), key);
				// Update the live data every 1 sec
				setTimeout(updateLiveData(), 2000);
			}
		}
		//////////////////////////////////////// Ajax - end //////////////////////////////////////////////////////////////////
	});
}());