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



var socket = io.connect('http://localhost:8085');
var serverKey = "joy";

socket.emit("getServerKey", {}, function (data)
{
	serverKey = data.serverKey;
});

$(document).ready(function ()
{
	$(document).on("click", "#loginButton", function (event)
	{
		event.preventDefault();
		
		var cpt = 0;

		var loadInter = setInterval(function ()
		{
			$("#loadDiv").append(".");
			cpt++;

			if (cpt > 20)
			{
				cpt = 0;
				$("#loadDiv").html("");
			}

		}, 100);

		socket.emit("callLogin", {"login": $("#loginInput").val(), "password": $("#passwordInput").val()}, function (data)
		{
			clearInterval(loadInter);
			$("#loadDiv").html("");

			if (data.ok)
			{
			 	setCookie("scrumyDevsterName", $("#loginInput").val());
		 		setCookie("session",data.session);		
                alert("session cookie : "+data.session);
				window.location = "index.html";
			}
			else
			{
				alert("WRONG!!");
			}
		}); //Fin de socket.emit


	});
});

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

var setCookie = function (name, value)
{
    var argv = setCookie.arguments;
    var argc = setCookie.arguments.length;
    var expires = (argc > 2) ? argv[2] : null;
    var path = (argc > 3) ? argv[3] : null;
    var domain = (argc > 4) ? argv[4] : null;
    var secure = (argc > 5) ? argv[5] : false;
    document.cookie = name + "=" + escape(value) + ((expires == null) ? "" : ("; expires=" + expires.toGMTString())) + ((path == null) ? "" : ("; path=" + path)) + ((domain == null) ? "" : ("; domain=" + domain)) + ((secure == true) ? "; secure" : "");
};