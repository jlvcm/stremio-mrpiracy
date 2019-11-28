const { addonBuilder } = require("stremio-addon-sdk")
const cheerio = require('cheerio')
const request = require('request')
const package = require('./package.json')
const mrpiracy_genrs = {'Ação':15,'Animação':14,'Animes':23,'Aventura':13,'Biografia':18,'Comédia':12,'Crime':11,'Curtas Metragens':36,'Desporto':27,'Documentário':10,'Drama':9,'Família':37,'Fantasia':8,'Faroeste':16,'Ficção Científica':24,'Guerra':6,'História':19,'LGBTI':32,'Mistério':20,'Musica':5,'Natal':30,'Policial':4,'Religião':21,'Romance':3,'Stand Up':35,'Suspense':2,'Terror':1,'Thriller ':22}

const endpoint = 'https://ww10.mrpiracy.top'

const manifest = {
	"id": "community.mrpiracy",
	version: package.version,
	"catalogs": [{'type':'movie','id':'mr_piracy','name':'Mr Piracy',"extra": [
		{
		  "name": "genre",
		  "options": Object.keys(mrpiracy_genrs),
		  "isRequired": false
		}
	  ]},{'type':'series','id':'mr_piracy','name':'Mr Piracy',"extra": [
		{
		  "name": "genre",
		  "options": Object.keys(mrpiracy_genrs),
		  "isRequired": false
		}
	  ]}],
	"resources": ["catalog"],
	"types": ['Movie','Series'],
	"name": "Mr Piracy",
	"description": "Mr Piracy",
	"idPrefixes": [
		"tt"
	]
}
const builder = new addonBuilder(manifest)
function getMoviesMRpiracy(page,type='filmes',cat=false){
	return new Promise((resolve, reject) => {
		request(endpoint+'/'+type+'.php?'+(cat?'categoria='+mrpiracy_genrs[cat]+'&':'')+'pagina='+page, function (error, response, html) {
			if (!error && response.statusCode == 200) {
				const $ = cheerio.load(html,{ decodeEntities: false });
				var metas = [];
				var $items = $('#movies-list .item');
				for (let i = 0; i < $items.length; i++) {
					const $item = $($items[i]);
					var imdb = $item.find('a').attr('href').match(/tt[^.]+/);
					if(imdb == undefined) continue;
					imdb = imdb[0];
					if(imdb.endsWith('pt')) imdb.slice(0,imdb.length-2);
					metas.push({
						id:imdb,
						name:$item.find('.original-name').text().replace(/\"/g,''),
						poster:endpoint+$item.find('.thumb img').attr('src'),
						year: $item.find('.year').text().replace(/\(|\)|\W/g,''),
						imdbRating: $item.find('.mp-rating-imdb').text().trim().split('/')[0],
						genres: $item.find('.genre').text().split(','),
						posterShape: 'regular',
						type:'movie'
					})
				}
				resolve(metas);
			}else{
				reject();
			}
		});
	});
}


// 
https://api.themoviedb.org
builder.defineCatalogHandler(function(args, cb) {
	// filter the dataset object and only take the requested type

	const cat = (args.extra || {}).genre ? args.extra.genre : false;
	const start = (args.extra || {}).skip ? Math.round(args.extra.skip / 10) + 1 : 1
	const type = args.type=='movie'?'filmes':'series'

	return new Promise((resolve, reject) => {
		Promise.all([getMoviesMRpiracy(start,type,cat), getMoviesMRpiracy(start+1,type,cat), getMoviesMRpiracy(start+2,type,cat), getMoviesMRpiracy(start+3,type,cat)]).then(function(values) {
			resolve({'metas':[].concat.apply([], values)});
		});
	});
});

module.exports = builder.getInterface()