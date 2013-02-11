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

///////////////TEST GITHB


var mongoose = require('mongoose');
var Projet, Story, Tache;

mongoose.connect('mongodb://localhost:27017/devster_scrummy', function (err)
{
    if (err) {
        throw err;
    }
});

User = mongoose.Schema({
    id: String,
    nom: String,
    password: String
});

Projet = mongoose.Schema({
    id: String,
	nom: String,
	state: String
});

Story = mongoose.Schema({
    id: String,
    id_projet: String,
	nom: String,
	progression: Number,
    start_date: String,
    end_date: String
});

Tache = mongoose.Schema({
    id: String,
    id_story: String,
	content: String,
	user: String,
	state: Number
});

Notif = mongoose.Schema({
    id: String,
    id_projet: String,
    user: String,
    created: {type: Date, default: Date.now},
    title: String,
    content: String
});

userModel = mongoose.model('userModel', User);
projetModel = mongoose.model('projetModel', Projet);
storyModel = mongoose.model('storyModel', Story);
tacheModel = mongoose.model('tacheModel', Tache);
notifModel = mongoose.model('notifModel', Notif);

var addUser = function (id, nom, password)
{
    var user = new userModel({
        id: id,
        nom: nom,
        password: password
    });

    user.save(function (err)
    {
        if (err)
        {
            throw err;
        }
    });
};

var addProjet = function (id, nom, state)
{
    var projet = new projetModel({
        id: id,
		nom: nom,
		state: state
    });

    projet.save(function (err)
    {
        if (err)
        {
            throw err;
        }
    });
};

var addStory = function (id, id_projet, nom, progression, startDate, endDate)
{
    var story = new storyModel({
        id: id,
	    id_projet: id_projet,
		nom: nom,
		progression: progression,
        start_date: startDate,
        end_date: endDate
    });

    story.save(function (err)
    {
        if (err)
        {
            throw err;
        }
    });
};

var addTache = function (id, id_story, content, user, state)
{
    var tache = new tacheModel({
        id: id,
	    id_story: id_story,
		content: content,
		user: user,
		state: state
    });

    tache.save(function (err)
    {
        if (err)
        {
            throw err;
        }
    });
};

var addNotif = function (id, projet, user, title, content)
{
    var notif = new notifModel({
        id: id,
        user: user,
        id_projet: projet,
        title: title,
        content: content
    });

    notif.save(function (err)
    {
        if (err)
        {
            throw err;
        }
    });
};

var searchMongo = function (model, condArray, callback)
{
    var query = model.find(null);

    for (var i = 0; i < condArray.length; i++)
    {
        query.where(condArray[i].attribut, condArray[i].valeur);
    }

    query.exec(function (err, res)
    {
        if (err)
        {
            throw err;
        }

        callback(res);
    });
};

exports.getUserModel = function () {
    return userModel;
};
exports.getProjetModel = function () {
    return projetModel;
};
exports.getStoryModel = function () {
    return storyModel;
};
exports.getTacheModel = function () {
    return tacheModel;
};
exports.getNotifModel = function () {
    return notifModel;
};
exports.addUser = addUser;
exports.addProjet = addProjet;
exports.addStory = addStory;
exports.addTache = addTache;
exports.addNotif = addNotif;
exports.searchMongo = searchMongo;