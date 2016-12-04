const util = require('util');
var express       = require('express'),
    FB            = require('fb'),
    http          = require('http'),
    path          = require('path'),

    config        = require('./config');

var app = express();
var request = require('request');


if(!config.facebook.appId || !config.facebook.appSecret) {
    throw new Error('facebook appId and appSecret required in config.js');
}


app.set('port', process.env.PORT || 8888);
// app.set('views', __dirname + '/views');
// app.set('view engine', 'ejs');
// app.use(express.logger('dev'));
// app.use(express.cookieParser());
// app.use(express.cookieSession({ secret: 'secret'}));
// app.use(express.bodyParser());
// app.use(express.methodOverride());
// app.use(app.router);
// app.use(express.static(path.join(__dirname, 'public')));


// app.configure('development', function() {
// app.use(express.errorHandler());
// });

var users_to=new Array();
var photo_url="";
var friends_num_bool;
var friends_num=100;
var friends_counter=0;
var likes_counter=0;
var likes_num=20;
var likes_num_bool;
var photos_tagged=5;
var photos_tagged_bool;
var feed_num=7;
var feed_num_bool;
var feed_counter=0;
var anho_post;
var anho_foto;
var anho_like;
var yo_duplicado=true;
var request_mio;

function contiene(list,obj)
{
  var retorno=false;
  for(i=0;i<list.length;i++)
  {
    if(list[i].name==obj.name)
    {
      retorno=true;
      break;
    }
  }
  return retorno;
}

function testAPI(access_token) {
  var FB = require('fb');
  FB.setAccessToken(access_token);
  console.log('Welcome!  Fetching your information.... ');

  FB.api('/me', 'get', {fields: 'id,name,gender,birthday' }, function(response) {
    console.log(response.id);
    user_id=response.id;
    mi_nombre=response.name;
    gender=response.gender;
    birthday=response.birthday;

    console.log("name:"+response.name);
    console.log("gender:"+response.gender);
    console.log("birthday:"+response.birthday);
    console.log('access_token:'+access_token);

    FB.api('/'+user_id, 'get', { access_token: access_token, fields: 'location,email' }, function(response) {
      if(response.hasOwnProperty("email"))
      {
        locacion=response.location.name;
        console.log("email:",response.email);
      }
      else {
        console.log("no email specified");
      }

      if(response.hasOwnProperty("location"))
      {
        locacion=response.location.name;
        console.log("location:",locacion);
      }
      else {
        console.log("no location specified");
      }


      FB.api('/'+user_id+"/picture", 'get', {type:'large'}, function(response) {
        console.log("picture:",response);
        photo_url=response.data.url;
      });

      function doSomething(response){
        if (response.paging.hasOwnProperty("next")){
          // console.log(response);
          FB.api(response.paging.next, doSomething);
          likes_counter+=response.data.length;
        }
        else {
          likes_counter+=response.data.length;
          console.log("first like:",response.data[response.data.length-1]);
          anho_like=response.data[response.data.length-1].created_time;
          var d = new Date(anho_like);
          console.log("anho_like:",d.getFullYear());
        }
      }

      FB.api('/'+user_id+"/likes",{limit:"8000"}, 'get', doSomething);
      setTimeout(function(){
        console.log("likes num:", likes_counter);
        if(likes_counter>likes_num)
          likes_num_bool=true;
        else {
          likes_num_bool=false;
        }
      },5000);

      FB.api('/'+user_id+"/friends", 'get', function(response) {
        console.log("friends:",response);
        // console.log(response);
        friends_counter=response.summary.total_count;
        if(response.summary.total_count>friends_num)
          friends_num_bool=true;
        else {
          friends_num_bool=false;
        }
      });

      FB.api('/'+user_id+"/photos",{limit:"100000"}, 'get', function(response) {
        console.log("photos:",response);
        // console.log(response);
        console.log("first foto:", response.data[response.data.length-1]);
        anho_foto=response.data[response.data.length-1].created_time;
        var d = new Date(anho_foto);
        console.log("anho_foto:",d.getFullYear());
        var largo = response.data.length;
        var unique_names = new Array();
        var all_names = new Array();

        for(i=0;i<largo;i++)
        {
          FB.api('/'+response.data[i].id+"/tags", 'get', function(response2) {
            for(j=0;j<response2.data.length;j++)
            {
              all_names.push({id:response2.data[j].id,name:response2.data[j].name,value:1});
              if(!contiene(unique_names,{name:response2.data[j].name, id:response2.data[j].id}))
              {
                unique_names.push({name:response2.data[j].name, id:response2.data[j].id});
              }
            }
          });
        }
        var res;

        // setTimeout(function(){console.log("unique_names:", unique_names);},2000);
        // setTimeout(function(){console.log("all_names:",all_names);},2000);
        setTimeout(function(){console.log("cuenta:");},2000);
        setTimeout(function(){
          var cuenta = Array();
          for(i=0;i<unique_names.length;i++)
          {
            var suma=0;
            for(j=0; j<all_names.length;j++)
            {
              if(all_names[j].name==unique_names[i].name)
              {
                suma+=1;
              }
            }
            cuenta.push({name:unique_names[i].name,id:unique_names[i].id,total:suma});
          }
          // console.log(cuenta);

          var friends_tagged_num=0;
          for(i=0;i<3;i++)
          {
            var mayor=0;
            var mayor_index=0;

            for(j=0;j<cuenta.length;j++)
            {
              if(cuenta[j].total>=mayor)
              {
                mayor=cuenta[j].total;
                mayor_index=j;
              }
            }
            if(cuenta[mayor_index].name==mi_nombre)
            {
              i--;
              console.log(cuenta[mayor_index]);
              request_mio = {id:cuenta[mayor_index].id,name:cuenta[mayor_index].name,total:1};

              cuenta.splice(mayor_index,1);
            }
            else {
              request_mio = {id:user_id,name:mi_nombre,total:1};
              console.log(cuenta[mayor_index]);
              users_to.push({id:cuenta[mayor_index].id,name:cuenta[mayor_index].name,total:1,tags:cuenta[mayor_index].total});

              if(cuenta[mayor_index].total>photos_tagged)
                friends_tagged_num++;
              cuenta.splice(mayor_index,1);
            }
          }
          console.log(friends_tagged_num);
          if(friends_tagged_num>=3)
            photos_tagged_bool=true;
          else {
            photos_tagged_bool=false;
          }
        },2000);
      });

      function doSomething2(response)
      {
        // console.log(response.data.length);
        // console.log(feed_num);
        if(feed_counter>feed_num)
          feed_num_bool=true;
        else {
          feed_num_bool=false;
        }

        if(response.data.length>0)
        {
          if (response.paging.hasOwnProperty("next")){
            console.log(response);
            FB.api(response.paging.next, doSomething2);
            feed_counter+=response.data.length
            if(response.data.length<275)
            {
              console.log("first feed:",response.data[response.data.length-2]);
              anho_post=response.data[response.data.length-2].created_time;
              var d = new Date(anho_post);
              console.log("anho_post:",d.getFullYear());
            }
          }
          else {
            console.log("first feed:",response.data[response.data.length-2]);
            anho_post=response.data[response.data.length-2].created_time;
            var d = new Date(anho_post);
            console.log("anho_post:",d.getFullYear());
          }
        }
      }

      FB.api('/'+user_id+"/feed",{limit:"8000"}, 'get', doSomething2);
      setTimeout(function()
      {
        console.log("feed num:", feed_counter);
        if(feed_counter>feed_num)
          feed_num_bool=true;
        else {
          feed_num_bool=false;
        }
      },4000);

      setTimeout(function(){
        console.log("likes bool:",likes_num_bool);
        console.log("friends bool:",friends_num_bool);
        console.log("photos tagged bool:",photos_tagged_bool);
        console.log("feed bool:",feed_num_bool);

        var verificado=likes_num_bool && friends_num_bool && photos_tagged_bool && feed_num_bool;
        //falta agregar esta variable al for para que se puedan agregar sus "contactos"

        if (verificado)
        {
          console.log(JSON.stringify(request_mio));

          $.ajax({
              data: JSON.stringify(request_mio),
              type: "POST",
              contentType: "application/json",
              url: "receive_data3.php"
          })
           .done(

             function( data, textStatus, jqXHR ) {
               if ( console && console.log ) {
                   console.log(jqXHR.responseText);
               }
               if(jqXHR.responseText!="1062")
               {
                 yo_duplicado=false;
                 console.log("yo_duplicado:", yo_duplicado);
               }
           })
           .fail(function( jqXHR, textStatus, errorThrown, XHR ) {
               if ( console && console.log ) {
                   console.log( "La solicitud ha fallado: " +  textStatus);
                   console.log( "La solicitud ha fallado: " +  errorThrown);
                   console.log( "La solicitud ha fallado: " +  jqXHR.responseText);
               }
          });
        }
        console.log(users_to);

        setTimeout(function(){
          for(i=0;i<users_to.length && !yo_duplicado;i++)
          {
            var request = users_to[i];
            console.log(JSON.stringify(request));

            $.ajax({
                data: JSON.stringify(request),
                type: "POST",
                contentType: "application/json",
                url: "receive_data4.php"
            })
             .done(
               function( data, textStatus, jqXHR ) {
                 if ( console && console.log ) {
                     console.log(jqXHR.responseText);
                 }
                 if(jqXHR.responseText=="1062")
                 {
                   console.log("hola");
                   $.ajax({
                       data: JSON.stringify(request),
                       type: "POST",
                       contentType: "application/json",
                       url: "receive_data2.php"
                   })
                    .done(
                      function( data, textStatus, jqXHR ) {
                        if ( console && console.log ) {
                            console.log(jqXHR.responseText);
                        }
                        if(jqXHR.responseText=="1062")
                        {
                          console.log("hola");
                        }
                    })
                    .fail(function( jqXHR, textStatus, errorThrown, XHR ) {
                        if ( console && console.log ) {
                            console.log( "La solicitud ha fallado: " +  textStatus);
                            console.log( "La solicitud ha fallado: " +  errorThrown);
                            console.log( "La solicitud ha fallado: " +  jqXHR.responseText);
                        }
                   });
                 }
             })
             .fail(function( jqXHR, textStatus, errorThrown, XHR ) {
                 if ( console && console.log ) {
                     console.log( "La solicitud ha fallado: " +  textStatus);
                     console.log( "La solicitud ha fallado: " +  errorThrown);
                     console.log( "La solicitud ha fallado: " +  jqXHR.responseText);
                 }
            });
          }
        },1000);

      },6000);
    });

  });

}


function show(){
    document.getElementById('nombre').innerHTML = mi_nombre;
    document.getElementById('gender').innerHTML = gender;
    document.getElementById('birthday').innerHTML = birthday;
    document.getElementById('email_tag').innerHTML = user_email;
    document.getElementById('locacion').innerHTML = locacion;
    document.getElementById('photo_url').innerHTML = photo_url;
    var anho_foto_solo = new Date(anho_foto);
    var anho_like_solo = new Date(anho_like);
    document.getElementById('anho_foto').innerHTML = "Año primera foto: "+anho_foto_solo.getFullYear();
    document.getElementById('anho_like').innerHTML = "Año primer like: "+anho_like_solo.getFullYear();
    document.getElementById('num_likes').innerHTML = "Número de likes: "+likes_counter;
    document.getElementById('num_feed').innerHTML = "Número de posts: "+feed_counter;
    document.getElementById('num_friends').innerHTML = "Número de amigos: "+friends_counter;

    for(i=0;i<users_to.length;i++)
    {
      document.getElementById('user'+i).innerHTML = "Amigos más taggeado "+i+": "+users_to[i].name+" con "+users_to[i].tags+" tags.";
    }

}

app.get('/', function (req, res) {
  console.log("Got a GET request for the homepage");
  // testAPI(access_token);
  var user_id;
  var user_name;
  var user_gender;
  var user_birthday;
  var user_location;
  var user_email;
  var user_picture_url;
  var access_token_data=req.query.token;
  FB.api('me', {
        fields:         'id,name,gender,birthday',
        access_token:   access_token_data
    }, function (result) {
        console.log("first",result);
        user_id=result.id;
        user_name=result.name;
        mi_nombre=result.name;
        user_gender=result.gender;
        user_birthday=result.birthday;
        if(!result || result.error) {
            return res.status(500).send('error1');
        }
        FB.api('/'+user_id, {
              fields:         'location,email',
              access_token:   access_token_data
          }, function (result) {
              console.log("second",result);
              user_location=result.location;
              user_email=result.email;

              if(!result || result.error) {
                  return res.status(500).send('error2');
              }

              FB.api('/'+user_id+'/picture', {
                    redirect: false,
                    type:'large'
                }, function (result) {
                    console.log("third",result.data);

                    user_picture_url=result.data.url;
                    if(!result || result.error) {
                        return res.status(500).send('error3');
                    }

                    function doSomething(error,response,body){
                      body=JSON.parse(body);
                      console.log("fourth2",body);
                      if (body.paging.hasOwnProperty("next")){
                        likes_counter+=body.data.length;
                        request(body.paging.next, doSomething);
                        // FB.api(,{access_token: access_token_data}, doSomething);
                      }
                      else {
                        console.log("first like:",body.data[body.data.length-1]);
                        anho_like=body.data[body.data.length-1].created_time;
                        var d = new Date(anho_like);
                        console.log("anho_like:",d.getFullYear());
                        anho_like=d.getFullYear();
                        likes_counter+=body.data.length;

                        FB.api('/'+user_id+"/friends", {
                          access_token:   access_token_data
                        }, function(response) {
                            console.log("fifth",response);
                            friends_counter=response.summary.total_count;
                            if(response.summary.total_count>friends_num)
                              friends_num_bool=true;
                            else {
                              friends_num_bool=false;
                            }

                            FB.api('/'+user_id+"/photos",{
                              access_token:access_token_data,limit:"100000"
                            }, function(response) {
                              console.log("photos:",response);
                              // console.log(response);
                              console.log("first foto:", response.data[response.data.length-1]);
                              anho_foto=response.data[response.data.length-1].created_time;
                              var d = new Date(anho_foto);
                              console.log("anho_foto:",d.getFullYear());
                              anho_foto=d.getFullYear();
                              var largo = response.data.length;
                              // console.log("largo",largo);
                              var unique_names = new Array();
                              var all_names = new Array();

                              for(i=0;i<largo;i++)
                              {
                                // var graph = require('fbgraph');
                                // graph.setAccessToken(access_token_data);
                                // console.log("asd");
                                // graph.get('/'+response.data[i].id+'/tags', function(err, res) {
                                //   console.log(err);
                                //   console.log(res);
                                // });

                                console.log("photo_id:",response.data[i].id);
                                //recorro los tags de cada una de las fotos
                                FB.api('/'+response.data[i].id+"/tags", {
                                  access_token:access_token_data
                                }, function(response2) {
                                  console.log("response2",response2);
                                  if(!response2 || response2.error) {
                                      return res.status(500).send('error6');
                                  }
                                  //guardo todos los tags (con repetición) en all_names
                                  for(j=0;j<response2.data.length;j++)
                                  {
                                    all_names.push({id:response2.data[j].id,name:response2.data[j].name,value:1});
                                    if(!contiene(unique_names,{name:response2.data[j].name, id:response2.data[j].id}))
                                    {
                                      unique_names.push({name:response2.data[j].name, id:response2.data[j].id});
                                    }
                                  }
                                });
                              }
                              setTimeout(function(){
                                console.log("all_names",all_names);
                                console.log("unique_names",unique_names);
                                var cuenta = Array();
                                for(i=0;i<unique_names.length;i++)
                                {
                                  var suma=0;
                                  for(j=0; j<all_names.length;j++)
                                  {
                                    if(all_names[j].name==unique_names[i].name)
                                    {
                                      suma+=1;
                                    }
                                  }
                                  cuenta.push({name:unique_names[i].name,id:unique_names[i].id,total:suma});
                                }
                                console.log("cuenta",cuenta);

                                var friends_tagged_num=0;
                                for(i=0;i<3;i++)
                                {
                                  var mayor=0;
                                  var mayor_index=0;

                                  for(j=0;j<cuenta.length;j++)
                                  {
                                    if(cuenta[j].total>=mayor)
                                    {
                                      mayor=cuenta[j].total;
                                      mayor_index=j;
                                    }
                                  }
                                  if(cuenta[mayor_index].name==mi_nombre)
                                  {
                                    i--;
                                    console.log(cuenta[mayor_index]);
                                    request_mio = {id:cuenta[mayor_index].id,name:cuenta[mayor_index].name,total:1};

                                    cuenta.splice(mayor_index,1);
                                  }
                                  else {
                                    request_mio = {id:user_id,name:mi_nombre,total:1};
                                    console.log(cuenta[mayor_index]);
                                    users_to.push({id:cuenta[mayor_index].id,name:cuenta[mayor_index].name,total:1,tags:cuenta[mayor_index].total});

                                    if(cuenta[mayor_index].total>photos_tagged)
                                      friends_tagged_num++;
                                    cuenta.splice(mayor_index,1);
                                  }
                                }
                                console.log(friends_tagged_num);
                                if(friends_tagged_num>=3)
                                  photos_tagged_bool=true;
                                else {
                                  photos_tagged_bool=false;
                                }
                                console.log("users_to",users_to);
                                res.send({id:user_id,name:user_name,gender:user_gender,birthday:user_birthday,location:user_location,email:user_email,picture:user_picture_url,likes_counter:likes_counter,anho_primer_like:anho_like,num_friends:friends_counter,most_tagged_friends:users_to});

                              },3000);

                            });
                          });
                      }
                    }

                    FB.api('/'+user_id+"/likes", {
                      limit:"8000",
                      access_token:   access_token_data
                    }, function(result) {
                        console.log("fourth",result);
                        if (result.hasOwnProperty("paging")){
                          likes_counter+=result.data.length;
                          request(result.paging.next, doSomething);
                          // FB.api(,{access_token: access_token_data}, doSomething);
                        }
                    });
              });
        });

  });


})

var server = app.listen(8888, function () {
   var host = server.address().address
   var port = server.address().port

   console.log("Example app listening at http://%s:%s", host, port)
})
