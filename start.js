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

var http = require('http');
var fs = require('fs');
var path = require('path');
var mongoose = require('mongoose');
var url = require('url');
var request = require('request');
var db = require("./dataBase");

var tabEtat = ["To Do", "In Progress", "Verify", "Done"];

var serverKey = Math.random() * 999999999999 + "-" + Math.random() * 999999999999 + "-" + Math.random() * 999999999999;

console.log("key: " + serverKey);

var getContentType = function(InUrl)
{
    var extname = path.extname('.' + InUrl);
    var contentType = 'text/html';

    switch (extname)
    {
	    case '.js':
	        contentType = 'text/javascript';
	        break;
	    case '.css':
	        contentType = 'text/css';
	        break;
	    case '.png':
	        contentType = 'image/png';
	        break;
	    case '.jpg':
	        contentType = 'image/png';
	        break;
	    case '.jpeg':
	        contentType = 'image/png';
	        break;
	    case '.woff':
	        contentType = 'font/opentype';
	        break;
    }

    return contentType;
};


var server = http.createServer(function(request, response)
{
    var filePath = './client' +url.resolve( url.parse(request.url).pathname,"");
    //console.log("filePath : "+filePath);

    if (filePath == './client/')
    {
        filePath = './client/login.html';
    }

    var contentType = getContentType(request.url);
    fs.exists(filePath, function(exists)
    {
        if (exists)
        {
            fs.readFile(filePath, function(error, content)
            {
                if (error)
                {
                    response.writeHead(500);
                    response.end();
                }
                else
                {
                    response.writeHead(200,{
                        'Content-Type': contentType
                    });

                    response.end(content, 'utf-8');
                }
            });
        }
        else
        {
            response.writeHead(404);
            response.end();
        }
    });

}).listen(8085);

var io = require("socket.io").listen(server);

io.configure(function()
{
    io.enable('browser client minification');  // send minified client 
    io.enable('browser client etag');      // apply etag caching logic based on version number 
    io.enable('browser client gzip');      // gzip the file 
    io.disable('destroy upgrade');
    io.set('log level', 2);
    io.set('transports', ['websocket', 'flashsocket', 'htmlfile', 'xhr-polling', 'jsonp-polling']);
});





/////////////BDD

    /*db.getUserModel().remove(null, function (err) {if (err) { throw err; }});
    db.getProjetModel().remove(null, function (err) {if (err) { throw err; }});
    db.getStoryModel().remove(null, function (err) {if (err) { throw err; }});
    db.getTacheModel().remove(null, function (err) {if (err) { throw err; }});
    db.getNotifModel().remove(null, function (err) {if (err) { throw err; }});*/

    //db.addUser("user1", "user", "user");
    /*db.addUser("user2", "callum", "callum");
    db.addUser("user3", "nico", "nico");
    db.addUser("user4", "bilal", "bilal");

    db.addProjet("p1", "projet1", "In Progress");
    db.addProjet("p2", "projet2", "In Progress");

    db.addStory("noStoryp1", "p1", "noStory", 0);
    db.addStory("noStoryp2", "p2", "noStory", 0);

    var d = "21/12/2012";

    db.addStory("s1", "p1", "story1", 0, d, d);
    db.addStory("s2", "p1", "story2", 0, d, d);
    db.addStory("s3", "p2", "story3", 0, d, d);
    db.addStory("s4", "p2", "story4", 0, d, d);

    db.addTache("taaa", "noStoryp1", "tazefe1", "jefje", 0);
    db.addTache("tbbb", "noStoryp2", "zefzefzef", "ffffaze", 0);

    db.addTache("t1", "s1", "tache1", "jeje", 0);
    db.addTache("t2", "s1", "tache2", "aze", 1);
    db.addTache("t3", "s2", "tache3", "jeje", 0);
    db.addTache("t4", "s2", "tache4", "aze", 2);
    db.addTache("t5", "s3", "tache5", "jeje", 0);
    db.addTache("t6", "s3", "tache6", "jeje", 3);
    db.addTache("t7", "s4", "tache7", "aze", 1);
    db.addTache("t8", "s4", "tache8", "aze", 0);*/

///////////////FIN BDD

io.sockets.on('connection', function(socket)
{
    var user;

    console.log('Socket Connection ! ');

    function checkSession(guid,CB_Logged,CB_notLogged)
    {
        if(guid != undefined)
        {
            db.searchMongo(db.getSessionModel(),[{attribut: "guid", valeur: guid}], function(rep){
                
            if(rep.length>0)
               {
                 CB_Logged(rep);
               } 
               else
                CB_notLogged();

            });
        }
        else
            CB_notLogged();
    }



 

      var onFunc = socket.on;
    socket.on = function ( ) {
        var eventKey = arguments[0];
           
        var callbackFunc = arguments[1];

        if(eventKey == "callLogin")
             return onFunc.apply(this,Array.prototype.slice.call(arguments));

        arguments[1] = function()
        {
            var callBackContext = this;
            var callBackArgs = arguments;
            var dataSentByClient = callBackArgs[0];
            //console.log(dataSentByClient);
            
            checkSession(dataSentByClient.session,function(){
               /* console.log("vous êtes logué");
                console.log("session : "+dataSentByClient.session);*/

                return callbackFunc.apply(callBackContext,Array.prototype.slice.call(callBackArgs));
            },function(){
                 console.log(eventKey + ""+callBackArgs);
                 console.log("vous n'êtes pas logué !");  
                 socket.emit("InvalidSession",{msg: "la session a expirée"});
            });

           
        };
       
        return onFunc.apply(this,Array.prototype.slice.call(arguments));
     
    };




    socket.on('getServerKey', function(data, cb)
    {
        cb({"serverKey": serverKey});
    });

    socket.on('callLogin', function(data, cb)
    {
        db.searchMongo(db.getUserModel(), [{attribut: "nom", valeur: data.login}, {attribut: "password", valeur: data.password}], function (rep)
        {
            if (rep.length > 0)
            {
                var sessionId = Math.random() * 999999999999 + "-" + Math.random() * 999999999999 + "-" + Math.random() * 999999999999;
                db.createSession(rep[0]._id,sessionId);
                cb({ok: true,session:sessionId});
            }
            else
            {
                cb({ok: false});
            }
        });
    });

    socket.on('LogOut',function(data)
        {
            db.deleteSessionById(data.session);
        });

    socket.on('searchNotif', function (data, cb)
    {
        db.searchMongo(db.getNotifModel(), data.condArray, function (rep)
        {
            cb(rep);
        });
    });

    socket.on('getInitialData', function(data, cb)
    {
    	var data;
        user = data.user;

        db.searchMongo(db.getProjetModel(), [], function(rep)
        {
            data.projects = rep;

            cb(data);
        });
    });





//////////////////////////////////////////////////////// TACHE

    socket.on("searchTache", function (data, cb)
    {
        db.searchMongo(db.getTacheModel(), data.condArray, function (rep)
        {
            cb(rep);
        });
    });

    socket.on("addTache", function (data)
    {
        console.log("     new Tache : " + data.content);

        if (data.story != "noStory")
        {
            db.getStoryModel().update({"id": data.story}, {"progression": data.newAv}, {}, function (err, numAffected){});
            db.addTache(data.id, data.story, data.content, data.user, 0, null, null);
        }
        else
        {
            db.addTache(data.id, ("noStory" + data.project), data.content, data.user, 0, null, null);
        }
        
        createNotif(socket, data.project, user, "Nouvelle Tache ajout&eacute; dans la story : " + ((data.story == "noStory") ? "noStory" : data.nomStory), "Tache : " + data.content + "<br/>Proprietaire : " + data.user);

        socket.broadcast.emit("newTache", data);
        socket.emit("newTache", data);
    });

    socket.on("deleteTache", function (data)
    {
        var idStory = data.story;
        var noStory = false;

        if (data.story == "noStory")
        {
            noStory = true;
            idStory += data.project;
        }   

        db.getStoryModel().findOne({"id": idStory}, function (err, story)
        {
            if (story != null)
            {
                story.progression = data.newAv;
                story.save();

                db.getTacheModel().findOne({"id": data.id}, function (err, tache)
                {
                    if (tache != null)
                    {
                        createNotif(socket, data.project, user, "Une Tache a &eacute;t&eacute; supprim&eacute; dans la story : " + ((noStory) ? "noStory" : story.nom), "Tache : " + tache.content + "<br/>Proprietaire : " + tache.user);
                    
                        db.getTacheModel().remove({"id": data.id}, function (err) {if (err) { throw err; }});

                        socket.broadcast.emit("tacheDeleted", data);
                        socket.emit("tacheDeleted", data);
                    }
                    else
                    {
                        console.log("error tacheModel");
                    }
                });
            }
            else
            {
                console.log("error storyModel");
            }
        });
    });

    socket.on("modifTache", function (data)
    {
        db.getTacheModel().findOne({"id": data.id}, function (err, tache)
        {
            if (tache != null)
            {
                var oContent = tache.content;
                var oUser = tache.user;

                tache.content = data.content;
                tache.user = data.user;
                tache.save();

                var detail = "Changement :";

                if (oContent != tache.content)
                {
                    detail += "<br/>Ancienne tache : " + oContent + "<br/>Nouvelle tache : " + data.content;
                }

                if (oUser != tache.user)
                {
                    detail += "<br/>Ancien proprietaire : " + oUser + "<br/>Nouveau proprietaire : " + data.user;
                }

                db.getStoryModel().findOne({"id": tache.id_story}, function (err, story)
                {
                    if (story != null)
                    {
                        createNotif(socket, data.project, user, "Une Tache a &eacute;t&eacute; modifi&eacute; dans la story : " + story.nom, detail);
                    
                        socket.broadcast.emit("tacheModified", data);
                        socket.emit("tacheModified", data);
                    }
                    else
                    {
                        console.log("error storyModel");
                    }
                });
            }
            else
            {
                console.log("error tacheModel");
            }
        });
    });

    socket.on("movingTache", function (data)
    {
        var oStory = (data.oStory == "noStory") ? ("noStory" + data.project) : data.oStory;
        var nStory = (data.nStory == "noStory") ? ("noStory" + data.project) : data.nStory;
        var nState = (data.nStory == "noStory") ? 0 : data.nState;

        db.getStoryModel().findOne({"id": oStory}, function (err, oldStory)
        {
            if (oldStory != null)
            {
                oldStory.progression = data.oldStoryAv;
                oldStory.save();

                db.getStoryModel().findOne({"id": nStory}, function (err, newStory)
                {
                    if (newStory != null)
                    {
                        newStory.progression = data.newStoryAv;
                        newStory.save();

                        db.getTacheModel().findOne({"id": data.tacheId}, function (err, tache)
                        {
                            if (tache != null)
                            {
                                var oState = tache.state;

                                tache.id_story = nStory;
                                tache.state = nState;
                                tache.save();

                                if (newStory.nom == oldStory.nom)
                                {
                                    createNotif(socket, data.project, user, "Une Tache a chang&eacute; d'&eacute;tat dans la story : " + newStory.nom, "Tache : " + tache.content + "<br/>Proprietaire : " + tache.user + "<br/>Ancienne Etat : " + tabEtat[oState] + "<br/>Nouvelle etat : " + tabEtat[nState]);
                                }
                                else
                                {
                                    createNotif(socket, data.project, user, "Une Tache a &eacute;t&eacute; deplac&eacute; dans la story : " + newStory.nom, "Tache : " + tache.content + "<br/>Proprietaire : " + tache.user + "<br/>Ancienne Story : " + oldStory.nom + "<br/>Ancienne Etat : " + tabEtat[oState] + "<br/>Nouvelle etat : " + tabEtat[nState]);
                                }
                            }
                            else
                            {
                                console.log("error tacheModel");
                            }
                        });
                    }
                    else
                    {
                        console.log("error storyModel");
                    }
                });
            }
            else
            {
                console.log("error storyModel");
            }
        });
/*         var sleep = require('sleep');
          sleep.sleep(3);//sleep for 5 seconds
          console.log("sleep");*/
        socket.broadcast.emit("tacheMoved", data);
        socket.emit("tacheMoved", data);
    });





//////////////////////////////////////////////////////// STORY

    socket.on("searchStory", function (data, cb)
    {
        db.searchMongo(db.getStoryModel(), data.condArray, function (rep)
        {
            cb(rep);
        });
    });

    socket.on("addStory", function (data)
    {
        console.log("     new Story : " + data.nom);

        db.addStory(data.id, data.project, data.nom, 0, data.startDate, data.endDate);

        if (data.startDate == "NaN" || data.endDate == "NaN")
        {
            var detail = "Aucune deadLine";
        }
        else
        {
            var detail = "Date de d&eacute;but : " + data.startDate + "<br/>Date de fin : " + data.endDate;
        }

        createNotif(socket, data.project, user, "Nouvelle Story ajout&eacute; : " + data.nom, detail);

        socket.broadcast.emit("newStory", data);
        socket.emit("newStory", data);
    });

    socket.on("deleteStory", function (data)
    {
        db.getTacheModel().remove({"id_story": data.id}, function (err) {if (err) { throw err; }});

        db.getStoryModel().findOne({"id": data.id}, function (err, story)
        {
            if (story != null)
            {
                if (story.start_date == "NaN" || story.end_date == "NaN")
                {
                    var detail = "Aucune deadLine";
                }
                else
                {
                    var detail = "Date de d&eacute;but : " + story.start_date + "<br/>Date de fin : " + story.end_date;
                }

                createNotif(socket, data.project, user, "Une Story a &eacute;t&eacute; supprim&eacute; : " + story.nom, detail                                                                                      );
            
                db.getStoryModel().remove({"id": data.id}, function (err) {if (err) { throw err; }});

                socket.broadcast.emit("storyDeleted", data);
                socket.emit("storyDeleted", data);
            }
            else
            {
                console.log("error storyModel");
            }
        });
    });

    socket.on("modifStory", function (data)
    {
        db.getStoryModel().findOne({"id": data.id}, function (err, story)
        {
            if (story != null)
            {
                var detail = "Changement :";

                if (story.nom != data.nom)
                {
                    detail += "<br/>Ancien nom : " + story.nom + "<br/>Nouveau nom : " + data.nom;
                    story.nom = data.nom;
                }

                if (story.start_date != data.startDate)
                {
                    if (data.startDate == "NaN")
                    {
                        detail += "<br/>La deadLine a &eacute;t&eacute; supprim&eacute";
                        story.start_date = data.startDate;
                        story.end_date = data.endDate;
                    }
                    else if (story.start_date == "NaN")
                    {
                        detail += "<br/>Une deadLine a &eacute;t&eacute; ajout&eacute : ";
                        detail += "<br/>Date de d&eacute;but : " + data.startDate;
                        detail += "<br/>Date de fin : " + data.endDate;

                        story.start_date = data.startDate;
                        story.end_date = data.endDate;
                    }
                }

                if (story.start_date != data.startDate)
                {
                    detail += "<br/>Ancienne date de d&eacute;but : " + story.start_date + "<br/>Date de d&eacute;but : " + data.startDate;
                    story.start_date = data.startDate;
                }

                if (story.end_date != data.endDate)
                {
                    detail += "<br/>Ancienne date de fin : " + story.end_date + "<br/>Nouvelle date de fin : " + data.endDate;
                    story.end_date = data.endDate;
                }

                story.save();

                createNotif(socket, data.project, user, "Une Story a &eacute;t&eacute; modifi&eacute; : " + story.nom, detail);
            
                socket.broadcast.emit("storyModified", data);
                socket.emit("storyModified", data);
            }
            else
            {
                console.log("error storyModel");
            }
        });
    });

//////////////////////////////////////////////////////// PROJECT

    socket.on("searchProject", function (data, cb)
    {
        db.searchMongo(db.getProjetModel(), data.condArray, function (rep)
        {
            cb(rep);
        });
    });

    socket.on("addProject", function (data)
    {
        db.addProjet(data.id, data.nom, "To Do");
        db.addStory(("noStory" + data.id), data.id, "", 0);

        console.log("     new Project : " + data.nom);

        socket.broadcast.emit("newProject", data);
        socket.emit("newProject", data);
    });

    socket.on("getProject", function (data, cb)
    {
        db.searchMongo(db.getProjetModel(), [{attribut: "id", valeur: data.id}], function (rep)
        {
            cb(rep[0]);
        });
    });

    socket.on("deleteProject", function (data)
    {
        db.searchMongo(db.getStoryModel(), [{attribut: "id_project", valeur: data.id}], function (rep)
        {
            for (var i = 0; i < rep.length; i++)
            {
                db.getTacheModel().remove({"id_story": rep[i].id}, function (err) {if (err) { throw err; }});
            }

            db.getStoryModel().remove({"id_project": data.id}, function (err) {if (err) { throw err; }});
            db.getProjetModel().remove({"id": data.id}, function (err) {if (err) { throw err; }});
        });

        socket.broadcast.emit("projectDeleted", data);
        socket.emit("projectDeleted", data);
    });

    socket.on("modifProject", function (data)
    {
        db.getProjetModel().update({"id": data.id}, {"nom": data.nom, "state": data.state}, {}, function (err, numAffected){});

        socket.broadcast.emit("projectModified", data);
        socket.emit("projectModified", data);
    });
});


var createNotif = function (socket, project, user, title, content)
{
    var notif = {
        id: "n" + parseInt(Math.random() * 999999999),
        created: new Date(),
        project: project,
        user: user,
        title: title,
        content: content
    };

    db.addNotif(notif.id, notif.project, notif.user, notif.title, notif.content);
    
    socket.broadcast.emit("newNotif", notif);
    socket.emit("newNotif", notif);
};
