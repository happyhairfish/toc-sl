var config = { };

// should end in /
config.rootUrl  = process.env.ROOT_URL                  || 'http://localhost:8888/';

config.facebook = {
    appId:          process.env.FACEBOOK_APPID          || '1421962814488097',
    appSecret:      process.env.FACEBOOK_APPSECRET      || '56d8bbe7a34f2d257944b57b9a391c85',
    appNamespace:   process.env.FACEBOOK_APPNAMESPACE   || 'toc_namespace',
    redirectUri:    process.env.FACEBOOK_REDIRECTURI    ||  config.rootUrl
};

module.exports = config;
