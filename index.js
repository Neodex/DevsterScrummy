/*

* Copyright (c) 2012, Goujon Jeremie, Neventy
* All rights reserved.
* Redistribution and use in source and binary forms, with or without
* modification, are permitted provided that the following conditions are met:
*
*     * Redistributions of source code must retain the above copyright
*       notice, this list of conditions and the following disclaimer.
*     * Redistributions in binary form must reproduce the above copyright
*       notice, this list of conditions and the following disclaimer in the
*       documentation and/or other materials provided with the distribution.
*     * Neither the name of the University of California, Berkeley nor the
*       names of its contributors may be used to endorse or promote products
*       derived from this software without specific prior written permission.
*
* THIS SOFTWARE IS PROVIDED BY THE REGENTS AND CONTRIBUTORS ``AS IS'' AND ANY
* EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
* WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
* DISCLAIMED. IN NO EVENT SHALL THE REGENTS AND CONTRIBUTORS BE LIABLE FOR ANY
* DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
* (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
* LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
* ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
* (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
* SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/

var socket = io.connect('http://bilal.panchbhaya.scrummy.jit.su:8080');

socket.emit("getServerKey", {}, function (data)
{
	if ((getCookie("scrumyDevster") != "ok" && getCookie("scrumyDevster") != "remindMe") || data.serverKey != getCookie("scrumyDevsterKey"))
	{
		window.location = "login.html";
	}
	else
	{
		if (getCookie("scrumyDevster") == "remindMe")
		{
			var t = new Date();
			t.setTime(t.getTime() + 24 * 3600 * 1000 * 300);

			setCookie("scrumyDevster", "remindMe", t);
			setCookie("scrumyDevsterName", getCookie("scrumyDevsterName"));
		}

		$(document).ready(function ()
		{
			$("#menuContent").css("left", parseInt($(document).width())/* - parseInt($("#menuContent").width()) - 10*/);
			$("#notifContainer").height(parseInt($(document).height()) - (parseInt($("#menuContent hr").offset().top) + parseInt($("#menuContent hr").css("margin-bottom"))) - 5);

			$("#menuContent").css("display", "none");
			$("#bodyContent").css("width", "100%");

			$("#viewHistorique").css("left", $(window).width() - parseInt($("#viewHistorique").width()) - 27);

			socket.emit("getInitialData", {user: getCookie("scrumyDevsterName")}, function (data)
			{
				data.projects.forEach(function(project)
				{
					$("#projectList").append("<tr id='" + project.id + "'><td class='projectNameCol'>" + project.nom + "</td><td class='projectStateCol'>" + project.state + "</td><td><img class='voirProjectButton imgBut' src='img/voir.png'><img class='suppProjectButton imgBut' src='img/effacer.png'><img class='modifProjectButton imgBut' src='img/reglage.png'></td></tr>");
				});
			});
		});
	}
});

var projectInView = "";
var mousePos = {
	x: 0,
	y: 0
};
var mouseInterval;
var selectedTache = null;
var targetCell = null;

document.onselectstart = new Function ("return false");

$(document).ready(function ()
{

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//																											 //
//												SOCKET BINDING												 //
//																											 //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////


	socket.on("newNotif", function (data)
	{
		if (data.project = projectInView)
		{
			addNotif(data.created, data.user, data.title, data.content);
		}
	});

	socket.on("newProject", function (data)
	{
		$("#projectList").append("<tr id='" + data.id + "'><td class='projectNameCol'>" + data.nom + "</td><td class='projectStateCol'>To Do</td><td><img class='voirProjectButton imgBut' src='img/voir.png'><img class='suppProjectButton imgBut' src='img/effacer.png'><img class='modifProjectButton imgBut' src='img/reglage.png'></td></tr>");
	});

	socket.on("newStory", function (data)
	{
		if (data.project == projectInView)
		{
			addStory(data.id, data.nom, 0, data.startDate, data.endDate);
		}
	});

	socket.on("newTache", function (data)
	{
		if (data.project == projectInView)
		{
			addTache(data.story, 0, data.id, data.content, data.user);
		}
	});

	socket.on("tacheMoved", function (data)
	{
		if (data.project == projectInView)
		{
			var tache = $("#" + data.tacheId);

			$("#" + data.oStory + " .progStory").html(data.oldStoryAv);
			$("#" + data.nStory + " .progStory").html(data.newStoryAv);

			tache.remove();

			if (data.nStory != "noStory")
			{
				$("#" + data.nStory).children().eq(parseInt(data.nState) + 2).append(tache);
			}
			else
			{
				$("#noStory td").append(tache);
			}
		}
	});

	socket.on("tacheDeleted", function (data)
	{
		var tache = $("#" + data.id);

		$("#" + tache.parent().parent().attr("id") + " .progStory").html(data.newAv);

		tache.remove();
	});

	socket.on("storyDeleted", function (data)
	{
		var story = $("#" + data.id);

		story.remove();
	});

	socket.on("tacheModified", function (data)
	{
		$("#" + data.id + " .tacheContent").html(data.content);
		$("#" + data.id + " .tacheUser").html(data.user);

		$("#" + data.id).css("background-color", "#" + getColorByName(data.user));
		$("#" + data.id).css("color", "#" + couleurinv(getColorByName(data.user)));
	});

	socket.on("storyModified", function (data)
	{
		$("#" + data.id + " .nomStory").html(data.nom);
		$("#" + data.id + " .startDate").html(data.startDate);
		$("#" + data.id + " .endDate").html(data.endDate);

		var aDate = new Date().getTime();
		var sDate = new Date(getBadDate(data.startDate)).getTime();
		var eDate = new Date(getBadDate(data.endDate)).getTime();

		var joursRestants = parseInt((eDate - aDate) / (1000 * 60 * 60 * 24)) + 1;
		var dureeTotal = parseInt((eDate - sDate) / (1000 * 60 * 60 * 24));
		var pourcRestant = joursRestants * 100 / dureeTotal;

		if (isNaN(joursRestants) && joursRestants != "Projet fini")
		{
			$("#" + data.id + " .deadLineInfo").css("display", "none");
		}
		else
		{
			$("#" + data.id + " .deadLineInfo").css("display", "inline");

			$("#" + data.id + " .joursRestants").html(joursRestants);

			if (pourcRestant < 33)
			{
				$("#" + data.id + " .joursRestants").css("background-color", "red");
			}
			else if (pourcRestant < 66)
			{
				$("#" + data.id + " .joursRestants").css("background-color", "orange");
			}
			else
			{
				$("#" + data.id + " .joursRestants").css("background-color", "green");
			}
		}
	});

	socket.on("projectDeleted", function (data)
	{
		var project = $("#" + data.id);

		if (projectInView == data.id)
		{
			$("#scrumTab").css("display", "none");
			$("#noStoryTab").css("display", "none");
			$("#projectTitle").html("");
		}

		project.remove();
	});

	socket.on("projectModified", function (data)
	{
		$("#" + data.id + " .projectNameCol").html(data.nom);
		$("#" + data.id + " .projectStateCol").html(data.state);
	});


///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//																											 //
//											DOCUMENT BINDING												 //
//																											 //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

	$(document).mousemove(function(e)
	{
		mousePos.x = e.pageX;
		mousePos.y = e.pageY;
	});

	$(document).mouseup(function (e)
	{
		clearInterval(mouseInterval);

		if (selectedTache != null)
		{
			$(targetCell).css("background-color", "white");
			$(selectedTache).css("position", "static");

			if (($(selectedTache).children(".tacheUser").html() != "UNASSIGNED" || $(targetCell).attr("data-state") == 0))
			{
				if (targetCell != $(selectedTache).parent()[0])
				{
					var oldStory = $(selectedTache).parent().parent().attr('id');
					var oldState = $(selectedTache).parent().attr("data-state");

					//$(selectedTache).remove();
					//$(targetCell).append($(selectedTache));

					var oldStoryAv = getStoryAvancement(oldStory);
					var newStoryAv = getStoryAvancement($(targetCell).parent().attr('id'));

					//$("#" + oldStory + " .progStory").html(oldStoryAv);
					//$("#" + $(targetCell).parent().attr('id') + " .progStory").html(newStoryAv);

					socket.emit("movingTache", {"project": projectInView, "tacheId": $(selectedTache).attr("id"), "oStory": oldStory, "nStory": $(targetCell).parent().attr('id'), "nState": $(targetCell).attr("data-state"), "oldStoryAv": oldStoryAv, "newStoryAv": newStoryAv});
				}
			}
			else
			{
				alert("Les taches UNASSIGNED ne peuvent pas etre deplacer");
			}
			
			selectedTache = null;
		}

		$(".freePopUp").each(function ()
		{
			if ($(this).css("display") != "none")
			{
				if ($(this).attr("id") != "modifProjectDiv" &&
					(e.pageX < $(this).offset().left || 
					e.pageX > $(this).offset().left + $(this).width() || 
					e.pageY < $(this).offset().top || 
					e.pageY > $(this).offset().top + $(this).height()))
				{
					$(this).hide();
				}
			}
		});
	});


	$(document).on("click", "#logoutButton", function ()
	{
		setCookie("scrumyDevster", "null");

		window.location = "login.html";
	});

	$(document).on("click", ".voirPlusButton", function ()
	{
		var div = $(this).parent().children(".notifContentDiv");

		if (div.css("display") == "block")
		{
			div.hide("fast");
		}
		else
		{
			div.show("fast");
		}
	});


	$(document).on("click", "#plusProjectButton", function()
	{
		//$("#newProjectDiv").css("display", "block");
		$("#newProjectDiv").css("top", mousePos.y);
		$("#newProjectDiv").css("left", mousePos.x);
		$("#newProjectDiv").show("fast");
	});

	$(document).on("click", "#viewHistorique", function ()
	{
		if ($("#viewHistorique").html() == "Ouvrir l'historique")
		{
			$("#menuContent").css("display", "block");
			$("#menuContent").css("width", "20%");
			$("#bodyContent").css("width", "80%");

			$("#menuContent").css("left", $(window).width() - parseInt($("#menuContent").width()));

			$("#viewHistorique").css("left", parseInt($("#menuContent").offset().left) - parseInt($("#viewHistorique").width()));
			$("#viewHistorique").html("Fermer l'historique");
		}
		else
		{
			$("#menuContent").css("display", "none");
			$("#bodyContent").css("width", "100%");

			$("#viewHistorique").css("left", $(window).width() - parseInt($("#viewHistorique").width()));
			$("#viewHistorique").html("Ouvrir l'historique");
		}
	});



///////////////////////////////////////////////// PROJECT

	$(document).on("click", "#viewListProjectButton", function ()
	{
		$("#projectViewDiv").css("display", "none");
		$("#projectSelectDiv").css("display", "block");
		$(".notifDiv").remove();

		$("#viewListProjectButton").css("display", "none");
		$(".title").css("display", "block");
		$("#menuContent").css("display", "none");
		$("#bodyContent").css("width", "100%");
	});

	$(document).on("click", "#newProjectButton", function ()
	{
		var newPName = $("#newProjectInput").val();
		$("#newProjectInput").val("");

		if (newPName != "")
		{
			var id = 'p' + parseInt(Math.random() * 999999999999999);

			socket.emit("addProject", {"id": id, "nom" : newPName});

			//$("#projectList").append("<tr id='" + id + "'><td class='projectNameCol'>" + newPName + "</td><td class='projectStateCol'>To Do</td><td><img class='voirProjectButton imgBut' src='img/voir.png'><img class='suppProjectButton imgBut' src='img/effacer.png'><img class='modifProjectButton imgBut' src='img/reglage.png'></td></tr>");
			
			$("#newProjectDiv").css("display", "none");
		}
		else
		{
			alert("champ vide");
		}
	});

	$(document).on("click", "#cancelProjetButton", function()
	{
		$("#newProjectDiv").css("display", "none");
	});

	$(document).on("click", ".voirProjectButton", function()
	{
		$("#projectViewDiv").css("display", "block");
		$("#projectSelectDiv").css("display", "none");

		$("#viewListProjectButton").css("display", "inline");
		$(".title").css("display", "none");

		//$("#menuContent").css("display", "block");
		$("#bodyContent").css("width", "100%");

		$(".story").remove();
		$("#noStory td *").remove();

		socket.emit("getProject", {"id": $(this).parent().parent().attr('id')}, function (data)
		{
			projectInView = data.id;

			$("#projectTitle").html(data.nom);

			socket.emit("searchNotif", {condArray: [{attribut: "id_projet", valeur: data.id}]}, function (data)
			{
				data.forEach(function (notif)
				{
					addNotif(notif.created, notif.user, notif.title, notif.content);
				});
			});

			socket.emit("searchStory", {condArray: [{attribut: "id_projet", valeur: data.id}]}, function (data)
			{
				data.forEach(function (story)
				{
					addStory(story.id, story.nom, story.progression, story.start_date, story.end_date);

					socket.emit("searchTache", {condArray: [{attribut: "id_story", valeur: story.id}]}, function (data)
					{
						if (story.id.split("noStory").length > 1)
						{
							story.id = "noStory";
						}

						data.forEach(function (tache)
						{
							addTache(story.id, tache.state, tache.id, tache.content, tache.user);
						});
					});
				});
			});
		});

		$("#scrumTab").css("display", "block");
		$("#noStoryTab").css("display", "block");
	});

	$(document).on("click", ".suppProjectButton", function()
	{
		if (confirm('Etes vous sur ?'))
		{
			socket.emit("deleteProject", {"id": $(this).parent().parent().attr("id")});

			/*if (projectInView == $(this).parent().parent().attr("id"))
			{
				$("#scrumTab").css("display", "none");
				$("#noStoryTab").css("display", "none");
				$("#projectTitle").html("");
			}

			$(this).parent().parent().remove();*/
		}
	});

	$(document).on("click", ".modifProjectButton", function()
	{
		var id = $(this).parent().parent().attr('id');

		//$("#modifProjectDiv").css("display", "block");
		$("#modifProjectDiv").css("top", mousePos.y);
		$("#modifProjectDiv").css("left", mousePos.x);
		$("#modifProjectDiv").show("fast");
		$("#modifProjectDiv").attr("data-id", id);

		$("#nNomProjectInput").val($("#" + id + " .projectNameCol").html());
		$("#nStateProjectSelect option[value=\"" + $("#" + id + " .projectStateCol").html() + "\"]").attr("selected", "selected");
	});

	$(document).on("click", "#modifProjectButton", function()
	{
		var nom = $("#nNomProjectInput").val();
		var state = $('#nStateProjectSelect option:selected').val()
		var id = $("#modifProjectDiv").attr("data-id");

		if (nom != "")
		{
			socket.emit("modifProject", {"id": id, "nom": nom, "state": state});
			
			/*$("#" + id + " .projectNameCol").html(nom);
			$("#" + id + " .projectStateCol").html(state);*/
			
			$("#nNomStoryInput").val("");
			$("#modifProjectDiv").css("display", "none");
		}
		else
		{
			alert("champ vide");
		}
	});

	$(document).on("click", "#cancelModifProjectButton", function()
	{
		$("#nNomStoryInput").val("");
		$("#modifProjectDiv").css("display", "none");
	});






///////////////////////////////////////////////// TACHE

	$(document).on("click", ".addTacheButton", function()
	{
		//$("#newTacheDiv").css("display", "block");
		$("#newTacheDiv").css("top", mousePos.y);
		$("#newTacheDiv").css("left", mousePos.x);
		$("#newTacheDiv").show("fast");
		$("#newTacheDiv").attr("data-story", $(this).parent().attr('id'));
	});

	$(document).on("click", "#creeTacheButton", function()
	{
		var desc = $("#descTacheInput").val();
		var prop = $("#propTacheInput").val();

		if (prop == "")
		{
			prop = "UNASSIGNED";
		}

		if (desc != "")
		{
			var id = 't' + parseInt(Math.random() * 999999999999999);
			var idStory = $("#newTacheDiv").attr("data-story");

			//addTache(idStory, 0, id, desc, prop);

			var newAv = getStoryAvancement(idStory);

			socket.emit("addTache", {"project": projectInView, "nomStory": $("#" + idStory + " .nomStory").html(), "story": idStory, "newAv": newAv, "user": prop, "id": id, "content": desc});
			
			$("#descTacheInput").val("");
			$("#propTacheInput").val("");
			$("#newTacheDiv").css("display", "none");
		}
		else
		{
			alert("champ vide");
		}
	});

	$(document).on("click", "#cancelTacheButton", function()
	{
		$("#descTacheInput").val("");
		$("#propTacheInput").val("");
		$("#newTacheDiv").css("display", "none");
	});

	$(document).on("click", ".tacheDelButton", function()
	{
		if (confirm('Etes vous sur ?'))
		{
			var tacheId = $(this).parent().parent().attr("id");
			var storyId = $("#" + tacheId).parent().parent().attr('id');

			/*$("#" + tacheId).remove();

			var newAv = getStoryAvancement(storyId);

			$("#" + storyId + " .progStory").html(newAv);*/

			var newAv = getStoryAvancement(storyId);

			socket.emit("deleteTache", {"id": $(this).parent().parent().attr("id"), "project": projectInView, "story": storyId, "newAv": newAv});
		}
	});

	$(document).on("mouseenter", ".tache", function ()
	{
		$(this).children(".tacheButton").animate({"opacity":"1"}, 200);
	});

	$(document).on("mouseleave", ".tache", function ()
	{
		$(this).children(".tacheButton").animate({"opacity":"0"}, 200);
	});

	$(document).on("click", ".tacheModifButton", function()
	{
		var id = $(this).parent().parent().attr('id');

		//$("#modifTacheDiv").css("display", "block");
		$("#modifTacheDiv").css("top", mousePos.y);
		$("#modifTacheDiv").css("left", mousePos.x);
		$("#modifTacheDiv").show("fast");
		$("#modifTacheDiv").attr("data-id", id);

		$("#nDescTacheInput").val($("#" + id + " .tacheContent").html());
		$("#nPropTacheInput").val($("#" + id + " .tacheUser").html());
	});

	$(document).on("click", "#modifTacheButton", function()
	{
		var desc = $("#nDescTacheInput").val();
		var prop = $("#nPropTacheInput").val();

		var id = $("#modifTacheDiv").attr("data-id");

		if (desc != $("#" + id + " .tacheContent").html() || prop != $("#" + id + " .tacheUser").html())
		{
			if (prop == "")
			{
				prop = "UNASSIGNED";
			}

			if (desc != "")
			{
				if (prop != "UNASSIGNED" || $("#" + id).parent().attr("data-state") == 0)
				{
					socket.emit("modifTache", {"id": id, "project": projectInView, "content": desc, "user": prop});
				
					/*$("#" + id + " .tacheContent").html(desc);
					$("#" + id + " .tacheUser").html(prop);

					$("#" + id).css("background-color", "#" + getColorByName(prop));
					$("#" + id).css("color", "#" + couleurinv(getColorByName(prop)));*/
					
					$("#nDescTacheInput").val("");
					$("#nPropTacheInput").val("");
					$("#modifTacheDiv").css("display", "none");
				}
				else
				{
					alert("Les taches UNASSIGNED seulement peuvent etre en To Do");
				}
			}
			else
			{
				alert("champ vide");
			}
		}
		else
		{
			$("#nDescTacheInput").val("");
			$("#nPropTacheInput").val("");
			$("#modifTacheDiv").css("display", "none");
		}
	});

	$(document).on("click", "#cancelModifTacheButton", function()
	{
		$("#nDescTacheInput").val("");
		$("#nPropTacheInput").val("");
		$("#modifTacheDiv").css("display", "none");
	});






///////////////////////////////////////////////// STORY

	$(document).on("click", "#newStoryButton", function()
	{
		//$("#newStoryDiv").css("display", "block");
		$("#newStoryDiv").css("top", mousePos.y - $("#newStoryDiv").height());
		$("#newStoryDiv").css("left", mousePos.x);
		$("#newStoryDiv").show("fast");
	});

	$(document).on("change", "#deadLineBox", function()
	{
		if (!$("#deadLineBox").attr('checked'))
		{
			$("#dateSelectDiv").css("display", "none");
		}
		else
		{
			$("#dateSelectDiv").css("display", "inline");
		}
	});

	$(document).on("change", "#nDeadLineBox", function()
	{
		if (!$("#nDeadLineBox").attr('checked'))
		{
			$("#nDateSelectDiv").css("display", "none");
		}
		else
		{
			$("#nDateSelectDiv").css("display", "inline");
		}
	});

	$(document).on("click", "#creeStoryButton", function()
	{
		var nom = $("#nomStoryInput").val();

		var sDate = 'NaN';
		var eDate = 'NaN';

		if ($("#dateSelectDiv").css("display") != "none")
		{
			sDate = getNiceDate($("#startDateStoryInput").val());
			eDate = getNiceDate($("#endDateStoryInput").val());
		}
		
		if ($("#dateSelectDiv").css("display") != "none" && (new Date($("#startDateStoryInput").val())).getTime() - (new Date($("#endDateStoryInput").val())).getTime() > 0)
		{
			alert("la date de debut est apres la date de fin");
		}
		else
		{
			if (nom != "" && sDate.split("undefined").length == 1 && eDate.split("undefined").length == 1)
			{
				var id = 's' + parseInt(Math.random() * 999999999999999);

				socket.emit("addStory", {"project": projectInView, "id": id, "nom": nom, "startDate": sDate, "endDate": eDate});
				//addStory(id, nom, 0, sDate, eDate);
				
				$("#nomStoryInput").val("");
				$("#startDateStoryInput").val("");
				$("#endDateStoryInput").val("");
				$("#newStoryDiv").css("display", "none");
			}
			else
			{
				alert("champ vide");
			}
		}
	});

	$(document).on("click", "#cancelStoryButton", function()
	{
		$("#nomStoryInput").val("");
		$("#deadLineBox").attr('checked', "checked");
		$("#dateSelectDiv").css("display", "inline");
		$("#startDateStoryInput").val("");
		$("#endDateStoryInput").val("");
		$("#newStoryDiv").css("display", "none");
	});

	

	$(document).on("click", ".storyDelButton", function()
	{
		if (confirm('Etes vous sur ?'))
		{
			socket.emit("deleteStory", {"id": $(this).parent().parent().parent().attr("id"), "project": projectInView});

			//$(this).parent().parent().remove();
		}
	});

	$(document).on("click", ".storyModifButton", function()
	{
		var id = $(this).parent().parent().parent().attr('id');

		//$("#modifStoryDiv").css("display", "block");
		$("#modifStoryDiv").css("top", mousePos.y);
		$("#modifStoryDiv").css("left", mousePos.x);
		$("#modifStoryDiv").show("fast");
		$("#modifStoryDiv").attr("data-id", id);

		$("#nNomStoryInput").val($("#" + id + " .nomStory").html());
		$("#nStartDateStoryInput").val(getBadDate($("#" + id + " .startDate").html()));
		$("#nEndDateStoryInput").val(getBadDate($("#" + id + " .endDate").html()));

		$("#nDateSelectDiv").css("display", $("#" + id + " .deadLineInfo").css("display"));

		if ($("#" + id + " .deadLineInfo").css("display") == "none")
		{
			$("#nDeadLineBox").removeAttr("checked");
		}
		else
		{
			$("#nDeadLineBox").attr("checked", "checked");
		}
	});

	$(document).on("click", "#modifStoryButton", function()
	{
		var nom = $("#nNomStoryInput").val();
		var id = $("#modifStoryDiv").attr("data-id");

		var startDate = 'NaN';
		var endDate = 'NaN';

		if ($("#nDateSelectDiv").css("display") != "none")
		{
			startDate = getNiceDate($("#nStartDateStoryInput").val());
			endDate = getNiceDate($("#nEndDateStoryInput").val());
		}

		if (nom != $("#" + id + " .nomStory").html() || startDate != $("#" + id + " .startDate").html() || endDate != $("#" + id + " .endDate").html())
		{

			if ($("#nDateSelectDiv").css("display") != "none" && (new Date($("#nStartDateStoryInput").val())).getTime() - (new Date($("#nEndDateStoryInput").val())).getTime() > 0)
			{
				alert("la date de debut est apres la date de fin");
			}
			else
			{
				if (nom != "" && startDate.split("undefined").length == 1 && endDate.split("undefined").length == 1)
				{
					socket.emit("modifStory", {"id": id, "nom": nom, "startDate": ($("#nDeadLineBox").attr('checked')) ? startDate : "NaN", "endDate": ($("#nDeadLineBox").attr('checked')) ? endDate : "NaN", "project": projectInView});
					
					/*$("#" + id + " .nomStory").html(nom);
					$("#" + id + " .startDate").html(startDate);
					$("#" + id + " .endDate").html(endDate);

					var aDate = new Date().getTime();
					var sDate = new Date(getBadDate(startDate)).getTime();
					var eDate = new Date(getBadDate(endDate)).getTime();

					var joursRestants = parseInt((eDate - aDate) / (1000 * 60 * 60 * 24)) + 1;
					var dureeTotal = parseInt((eDate - sDate) / (1000 * 60 * 60 * 24));
					var pourcRestant = joursRestants * 100 / dureeTotal;

					if (!$("#nDeadLineBox").attr('checked') || (isNaN(joursRestants) && joursRestants != "Projet fini"))
					{
						$("#" + id + " .deadLineInfo").css("display", "none");
					}
					else
					{
						$("#" + id + " .deadLineInfo").css("display", "block");

						$("#" + id + " .joursRestants").html(joursRestants);

						if (pourcRestant < 33)
						{
							$("#" + id + " .joursRestants").css("background-color", "red");
						}
						else if (pourcRestant < 66)
						{
							$("#" + id + " .joursRestants").css("background-color", "orange");
						}
						else
						{
							$("#" + id + " .joursRestants").css("background-color", "green");
						}
					}*/
					
					$("#nNomStoryInput").val("");
					$("#nStartDateStoryInput").val("");
					$("#nEndDateStoryInput").val("");
					$("#modifStoryDiv").css("display", "none");
				}
				else
				{
					alert("champ vide");
				}
			}
		}
		else
		{
			$("#nNomStoryInput").val("");
			$("#modifStoryDiv").css("display", "none");
		}
	});

	$(document).on("click", "#cancelModifStoryButton", function()
	{
		$("#nNomStoryInput").val("");
		$("#modifStoryDiv").css("display", "none");
	});
});



///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//																											 //
//													FUNCTIONS												 //
//																											 //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////


var bindDraggable = function (id)
{
	$(document).off("mousedown", "#" + id + " > .tacheDrag");

	$(document).on("mousedown", "#" + id + " > .tacheDrag", function ()
	{
		var offsetX = mousePos.x - $("#" + id).offset().left;
		var offsetY = mousePos.y - $("#" + id).offset().top;

		$("#" + id).css("position", "absolute");

		selectedTache = $("#" + id);

		mouseInterval = setInterval(function ()
		{
			$("td").each(function ()
			{
				if (collision(mousePos.x, mousePos.y, 0, 0, $(this).offset().left, $(this).offset().top, $(this).height(), $(this).width()))
				{
					$(targetCell).css("background-color", "white");
					$(this).css("background-color", "#aaa");
					targetCell = this;
				}
			});

			$("#" + id).css("top", mousePos.y - offsetY);
			$("#" + id).css('left', mousePos.x - offsetX);

		}, 30);
	});
}


var addTache = function (story, etat, id, content, user)
{
	var codeColor = getColorByName(user);

	var nTache = $("<div id='" + id + "' class='tache'><div class='tacheDrag'></div><div class='tacheContent'>" + content + "</div><div class='tacheUser'>" + user + "</div><div class='tacheButton'><input class='tacheDelButton' type='button' value=''><br/><input class='tacheModifButton' type='button' value=''></div></div>");
	nTache.css("background-color", "#" + codeColor);
	nTache.css("color", "#" + couleurinv(codeColor));
	bindDraggable(id);

	$("#" + story).children("td").eq(etat).append(nTache);

	if (story != "noStory")
	{
		var newStoryAv = getStoryAvancement(story);
		$("#" + story + " .progStory").html(newStoryAv);
	}
};

var getColorByName = function (name)
{
	var codeColor = 0;

	for (var i = 0; i < name.length; i++)
	{
		codeColor += name.charCodeAt(i);
	}

	codeColor = codeColor.toString(16);

	if (codeColor.length > 6)
	{
		codeColor = codeColor.splice(6, codeColor.length - 6);
	}
	else if (codeColor.length < 6)
	{
		var length = 6 - codeColor.length;

		for (var i = 0; i < length; i++)
		{
			codeColor += codeColor[i];
		}
	}

	return codeColor;
};

function couleurinv (color)
{
	var couleurs="0123456789ABCDEF";
	var couleurs2="FEDCBA9876543210";
	var newcouleur="";
	var i, j;

	for (i = 0; i < 6; i++)
	{
		for (j = 0; j < couleurs.length; j++)
		{
			if (couleurs.substr(j, 1) == color.substr(i, 1))
			{
				newcouleur = newcouleur + couleurs2.substr(j, 1);
			}
		}
	}

	return newcouleur;
}

var addStory = function (id, nom, prog, startDate, endDate)
{
	if (id.split("noStory").length == 1)
	{
		var aDate = new Date().getTime();
		var sDate = new Date(getBadDate(startDate)).getTime();
		var eDate = new Date(getBadDate(endDate)).getTime();

		var joursRestants = parseInt((eDate - aDate) / (1000 * 60 * 60 * 24)) + 1;
		var dureeTotal = parseInt((eDate - sDate) / (1000 * 60 * 60 * 24));
		var pourcRestant = joursRestants * 100 / dureeTotal;

		$("#scrumTab").append('<tr id="' + id + '" class="story"><th class="descStory"><span class="nomStory">' + nom + '</span><div class="progStoryDiv">Avancement : <span class="progStory">' + prog + '</span> %</div><div class="deadLineInfo"><div class="dateDiv">D&eacute;but : <span class="startDate">' + startDate + '</span><br/>Fin : <span class="endDate">' + endDate + '</span></div><div class="joursRestantsDiv">Jours restants : <span class="joursRestants">' + joursRestants + '</span></div></div><div class="storyButtonDiv"><input class="storyDelButton" type="button" value="supprimer"><input class="storyModifButton" type="button" value="Modifier"></div></th> <th class="addButton addTacheButton" width="30px">+</th> <td data-state="0"></td> <td data-state="1"></td> <td data-state="2"></td> <td data-state="3"></td></tr>');
	
		if (isNaN(joursRestants) && joursRestants != "Projet fini")
		{
			$("#" + id + " .deadLineInfo").css("display", "none");
		}
		else
		{
			if (pourcRestant < 33)
			{
				$("#" + id + " .joursRestants").css("background-color", "red");
			}
			else if (pourcRestant < 66)
			{
				$("#" + id + " .joursRestants").css("background-color", "orange");
			}
			else
			{
				$("#" + id + " .joursRestants").css("background-color", "green");
			}
		}
	}
};

var addNotif = function (date, user, title, content)
{
	date = new Date(date);
	var d = ((date.getDate() < 10) ? "0" : "") + date.getDate() + "/" + (((date.getMonth() + 1) < 10) ? "0" : "") + (date.getMonth() + 1) + "/" + date.getFullYear() + " - " + date.getHours() + ":" + date.getMinutes();

	$("<div class='notifDiv'><div id='.notifDate'>" + d + "</div><div id='.notifUser'>" + user + " : </div><br/><div id='.notifTitle'>" + title + "</div><br/><span class='voirPlusButton'>Details</span><div class='notifContentDiv'>" + content + "</div></div>").hide().prependTo("#notifContainer").show("normal");

}

var getStoryAvancement = function (story)
{
	var cptTache = 0;
	var sumTache = 0;

	for (var i = 0; i < $("#" + story + " .tache").length; i++)
	{
		cptTache++;

		switch ($($("#" + story + " .tache")[i]).parent().attr("data-state"))
		{
			case "0":
				sumTache += 0;
				break;
			case "1":
				sumTache += 33;
				break;
			case "2":
				sumTache += 66;
				break;
			case "3":
				sumTache += 100;
				break;
		}
	}

	if (cptTache == 0)
	{
		return (0);
	}

	return (sumTache / cptTache);
};

var collision = function (x1, y1, h1, w1, x2, y2, h2, w2)
{
	if ((x2 >= x1 + w1)
		|| (x2 + w2 <= x1)
		|| (y2 >= y1 + h1)
		|| (y2 + h2 <= y1))
	{
		return false;
	}
	else
	{
		return true;
	}
};

var getNiceDate = function (date)
{
	var tabDate = date.split("-");

	return (tabDate[2] + "/" + tabDate[1] + "/" + tabDate[0]);
};

var getBadDate = function (date)
{
	var tabDate = date.split("/");

	return (tabDate[2] + "-" + tabDate[1] + "-" + tabDate[0]);
};

function getCookie(check_name)
{
    var a_all_cookies = document.cookie.split(';');
    var a_temp_cookie = '';
    var cookie_name = '';
    var cookie_value = '';
    var b_cookie_found = false;

    for (i = 0; i < a_all_cookies.length; i++)
    {
        a_temp_cookie = a_all_cookies[i].split('=');
        cookie_name = a_temp_cookie[0].replace(/^\s+|\s+$/g, '');

        if (cookie_name == check_name)
        {
            b_cookie_found = true;

            if (a_temp_cookie.length > 1)
            {
                cookie_value = unescape(a_temp_cookie[1].replace(/^\s+|\s+$/g, ''));
            }

            return cookie_value;
            break;
        }

        a_temp_cookie = null;
        cookie_name = '';
    }

    if (!b_cookie_found) 
    {
        return null;
    }
};

function setCookie(name, value)
{
    var argv = setCookie.arguments;
    var argc = setCookie.arguments.length;
    var expires = (argc > 2) ? argv[2] : null;
    var path = (argc > 3) ? argv[3] : null;
    var domain = (argc > 4) ? argv[4] : null;
    var secure = (argc > 5) ? argv[5] : false;
    document.cookie = name + "=" + escape(value) + ((expires == null) ? "" : ("; expires=" + expires.toGMTString())) + ((path == null) ? "" : ("; path=" + path)) + ((domain == null) ? "" : ("; domain=" + domain)) + ((secure == true) ? "; secure" : "");
};