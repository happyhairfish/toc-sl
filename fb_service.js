const util = require('util');
//algunos módulos NPM útiles para el servicio, el de Facebook es "fb"
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

//aquí se setea el puerto que está escuchando
app.set('port', process.env.PORT || 8888);

//las variables globales que luego irán en el retorno
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

//función auxiliar para saber si una lista contiene a un objeto
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

//función que recibe el get
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
  //primer get a la api de facebook, de aquí en adelante todos los request son anidados, para que no haya problemas por ser asíncronos
  FB.api('me', {
        fields:         'id,name,gender,birthday',
        access_token:   access_token_data
    }, function (result) {
        console.log("first",result);
        //Se guardan estos datos en sus variables globales respectivas
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
                    //este parámetro es para el tamaño de la foto de perfil
                    type:'large'
                }, function (result) {
                    console.log("third",result.data);
                    //profile picture url
                    user_picture_url=result.data.url;
                    if(!result || result.error) {
                        return res.status(500).send('error3');
                    }
                    //esta función sirve para recorrer las áginas de los likes, y así contarlos. es recursiva, y el caso base es cuando el response ya no tiene un "next" de paginación
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
                        //una vez que se obtienen todos los likes, se puede extraer el primero y ver en qué año fue
                        console.log("anho_like:",d.getFullYear());
                        anho_like=d.getFullYear();
                        likes_counter+=body.data.length;

                        //aquí se hace el request de los amigos, y cuántos son
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
                              //aquí se obtiene el año de la primera foto
                              console.log("anho_foto:",d.getFullYear());
                              anho_foto=d.getFullYear();
                              var largo = response.data.length;

                              var unique_names = new Array();
                              var all_names = new Array();

                              //por cada foto, se hace un request con las personas tageadas y se guardan en una lista
                              for(i=0;i<largo;i++)
                              {
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
                              //después que se guardan todos (se hace un timeout para asegurarse de esto), se cuentan las ocurrencias de los tags
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

                                //luego, se extraen los tres amigos más tageados
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
                                //finalmente se envía el JSON con la info extraída
                                console.log("users_to",users_to);
                                res.send({id:user_id,name:user_name,gender:user_gender,birthday:user_birthday,location:user_location,email:user_email,picture:user_picture_url,likes_counter:likes_counter,anho_primer_like:anho_like,anho_primera_foto:anho_foto,num_friends:friends_counter,most_tagged_friends:users_to});

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

//Aquí se inicializa el servicio
var server = app.listen(8888, function () {
   var host = server.address().address
   var port = server.address().port

   console.log("Example app listening at http://%s:%s", host, port)
})
