const { addonBuilder } = require("stremio-addon-sdk")
const cheerio = require('cheerio')
var request = require('request');

const mrpiracy_genrs = {'Ação':15,'Animação':14,'Animes':23,'Aventura':13,'Biografia':18,'Comédia':12,'Crime':11,'Curtas Metragens':36,'Desporto':27,'Documentário':10,'Drama':9,'Família':37,'Fantasia':8,'Faroeste':16,'Ficção Científica':24,'Guerra':6,'História':19,'LGBTI':32,'Mistério':20,'Musica':5,'Natal':30,'Policial':4,'Religião':21,'Romance':3,'Stand Up':35,'Suspense':2,'Terror':1,'Thriller ':22}
/*
        const meta = {
            id: 'tt1254207',
            name: 'Big Buck Bunny',
            year: 2008,
            poster: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/uVEFQvFMMsg4e6yb03xOfVsDz4o.jpg',
            posterShape: 'regular',
            banner: 'https://image.tmdb.org/t/p/original/aHLST0g8sOE1ixCxRDgM35SKwwp.jpg',
            type: 'movie'
		}
	*/
// Docs: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/responses/manifest.md
const manifest = {
	"id": "community.mrpiracy",
	"version": "0.0.1",
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
		request('https://ww10.mrpiracy.top/'+type+'.php?'+(cat?'categoria='+mrpiracy_genrs[cat]+'&':'')+'pagina='+page, function (error, response, html) {
			if (!error && response.statusCode == 200) {
				const $ = cheerio.load(html);
				var metas = []
				var $items = $('#movies-list .thumb img');
				for (let i = 0; i < $items.length; i++) {
					const $item = $items[i];
					var capa = 'https://ww10.mrpiracy.top'+$item.attribs.src;
								var imdb = $item.attribs.src.match(/tt[^.]+/);
					if(imdb == undefined) continue;
					imdb = imdb[0];
					name = $item.attribs.alt
					metas.push({
						id:imdb,
						name:name,
						poster:capa,
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
	start = 1;
	cat = false;
	type = 'filmes';
	console.log(args,cb);
	if(args.extra && args.extra.skip){
		start = Math.round(args.extra.skip/10)
	}
	if(args.type == 'series'){
		type = 'series'
	}
	if(args.extra && args.extra.genre){
		cat = args.extra.genre;
	}
	return new Promise((resolve, reject) => {
		Promise.all([getMoviesMRpiracy(start,type,cat), getMoviesMRpiracy(start+1,type,cat), getMoviesMRpiracy(start+2,type,cat), getMoviesMRpiracy(start+3,type,cat)]).then(function(values) {
			resolve({'metas':[].concat.apply([], values)});
		});
	});
});

module.exports = builder.getInterface()