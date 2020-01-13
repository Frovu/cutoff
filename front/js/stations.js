const stations = [
	new Station(23.01, 72.76, 'Ahmedabad'),
	new Station(35.08,-106.62, 'Albuquerque'),
	new Station(43.14,  76.60, 'AlmaAtaB'),
	new Station(82.50, -62.33, 'Alert'),
	new Station(67.55,  33.33, 'Apatity'),
	new Station(37.97,  23.72, 'Athens'),
	new Station(43.28,  42.69, 'Baksan'),
	new Station(39.08, 116.27, 'Beijing'),
	new Station(37.87,-122.27, 'Berkeley'),
	new Station(46.95,  7.98, 'Bern'),
	new Station(78.12, 14.42, 'Barentsburg'),
	new Station(27.42,153.12, 'Brisbane'),
	new Station(34.60,-58.48, 'BuenosAires'),
	new Station(44.63,  5.91 , 'Bure'),
	new Station(51.08,-114.13, 'Calgary'),
	new Station(68.92,-179.47, 'CapeShmidt'),
	new Station(66.28, 110.53, 'Casey'),
	new Station(16.32, -68.15, 'Chacaltaya'),
	new Station(41.83, -87.67, 'Chicago'),
	new Station(58.75, -94.08, 'Churchill'),
	new Station(39.37,-106.18, 'Climax'),
	new Station(64.08,-147.83, 'College'),
	new Station(31.42, -64.20, 'Cordoba'),
	new Station(32.98, -96.73, 'Dallas'),
	new Station(12.43, 130.87, 'Darwin'),
	new Station(46.10, -77.50, 'Deepriver'),
	new Station(39.67,-104.97, 'Denver'),
	new Station(50.10,   4.60, 'Dourbes'),
	new Station(43.10, -70.83, 'Durham'),
	new Station(33.30,  35.79, 'ESOIMtHermon'),
	new Station(60.02,-111.93, 'FortSmith'),
	new Station(37.75, 140.48, 'Fukushima'),
	new Station(53.27, -60.40, 'GooseBay'),
	new Station(40.56,   3.16, 'Guadalajara'),
	new Station(47.31,  11.38, 'Hafelekar'),
	new Station(20.72,-156.27, 'Haleakala'),
	new Station(51.48,  11.97, 'Halle'),
	new Station(80.60,  58.00, 'HeissIsland'),
	new Station(34.42,  19.22, 'Hermanus'),
	new Station(50.88,   0.33, 'Herstmonceux'),
	new Station(42.90, 147.33, 'Hobart'),
	new Station(12.03, -75.33, 'Huancayo'),
	new Station(68.35,-133.72, 'Inuvik'),
	new Station(52.37, 100.55, 'Irkutsk2'),
	new Station(51.29, 100.55, 'Irkutsk3'),
	new Station(52.47, 104.03, 'Irkutsk'),
	new Station(46.55,   7.98, 'Jungfraujoch1'),
	new Station(46.55,   7.98, 'Jungfraujoch'),
	new Station(49.35,  70.25, 'Kerguelen'),
	new Station(48.50, 135.20, 'Khabarovsk'),
	new Station(54.33,  10.13, 'Kiel'),
	new Station(50.72,  30.30, 'Kiev'),
	new Station(42.99, 147.29, 'Kingston'),
	new Station(67.83,  20.43, 'Kiruna'),
	new Station(10.23,  77.48, 'Kodaikanal'),
	new Station(54.12,  11.77, 'Kuhlungsborn'),
	new Station(20.73,-156.33, 'Kula'),
	new Station(62.20, -58.96, 'Larckinggeorge'),
	new Station(40.00,-105.00, 'Leadville'),
	new Station(53.83,  -1.58, 'Leeds'),
	new Station(51.60,  10.10, 'Lindau'),
	new Station(49.20,  20.22, 'LomnickyStit'),
	new Station(51.53,  -0.10, 'London'),
	new Station(60.12, 151.02, 'Magadan'),
	new Station(21.30,-157.65, 'MakapuuPoint'),
	new Station( 0.33,  32.55, 'Makerere/Kampala'),
	new Station(67.60, 62.88 , 'Mawson'),
	new Station(77.85, 166.72, 'Mcmurdo'),
	new Station(19.33, -99.18, 'MexicoCity'),
	new Station(23.10, -65.70, 'MinaAguila'),
	new Station(66.55,  93.02, 'Mirny'),
	new Station(39.70, 141.13, 'Morioka'),
	new Station(55.47,  37.32, 'Moscow'),
	new Station(36.11, 137.55, 'MtNorikura'),
	new Station(51.20,-115.60, 'MtSulphur'),
	new Station(44.30, -71.30, 'MtWashington'),
	new Station(42.92, 147.23, 'MtWellington'),
	new Station(48.20,  11.60, 'Munchen'),
	new Station(68.63,  33.27, 'Murmansk'),
	new Station(56.55, -61.68, 'Nain'),
	new Station(43.30,  43.25, 'Nalchik'),
	new Station(52.23,   5.08, 'Nera/Nederhorst'),
	new Station(39.68, -75.75, 'newark'),
	new Station(69.26,  88.05, 'Norilsk'),
	new Station(54.80,  83.00, 'Novosibirsk'),
	new Station(45.44, -70.68, 'Ottawa'),
	new Station(65.02,  25.50, 'Oulu'),
	new Station(54.98, -85.44, 'Peawanuck'),
	new Station(42.93,   0.25, 'PicDu-Midi'),
	new Station(26.68,  27.10, 'Potchefstrom'),
	new Station(47.70,  12.90, 'Predigtstuhl'),
	new Station(18.18, -69.55, 'Putre'),
	new Station(24.32,  81.17, 'Rewa'),
	new Station(22.95, -43.17, 'RioDeJaneiro'),
	new Station(41.86,  12.47, 'Rome'),
	new Station(74.68, -94.90, 'ResoluteBay'),
	new Station(32.72,-105.75, 'SacramentoPeak'),
	new Station(39.38,  66.56, 'Samarcand'),
	new Station(70.67,  -2.85, 'Sanae'),
	new Station(70.30,  -2.35, 'Sanae8'),
	new Station(33.89, 151.19, 'Sydney'),
	new Station(33.48, -70.71, 'Satniago'),
	new Station(37.53, 126.93, 'Seoul'),
	new Station(90.00,   0.00, 'SouthPole'),
	new Station(90.00,   0.00, 'Southpole,w/oPb'),
	new Station(56.73,  61.07, 'Sverdlovsk'),
	new Station(39.90, -75.35, 'Swarthmore'),
	new Station(41.33,  69.62, 'Tashkent'),
	new Station(41.72,  44.80, 'Tbilisi'),
	new Station(18.58,  98.48, 'Thailand'),
	new Station(76.50, -68.70, 'Thule'),
	new Station(66.65, 140.01, 'Terreadelie'),
	new Station(30.11,  90.53, 'Tibet'),
	new Station(71.60, 128.90, 'TixieBay'),
	new Station(35.75, 139.72, 'Tokyo(itabashi)'),
	new Station(19.20,  17.58, 'Tsumeb'),
	new Station(52.10,   5.12, 'Utrecht'),
	new Station(59.85,  17.55, 'Uppsala'),
	new Station(54.80, -68.30, 'Ushuaia'),
	new Station(48.42,-123.32, 'Victoria'),
	new Station(78.47, 106.87, 'Vostok'),
	new Station(66.42, 110.45, 'Wilkes'),
	new Station(30.11,  90.53, 'YangBaJing'),
	new Station(62.02, 129.73, 'Yakutsk'),
	new Station(40.17,  44.25, 'Yerevan'),
	new Station(40.17,  44.25, 'Yerevan3'),
	new Station(47.42,  10.98, 'Zugspitze')
];

function Station (latitude, longitude, name) {
	this.latitude = latitude;
	this.longitude = longitude;
	this.name = name;
}

function selectStation (station) {
    $('#lat').val(station.latitude);
    $('#lon').val(station.longitude);
}

stations.forEach(function (station) {
	//const dropdown = document.getElementById('stationDropdown');
    const html = $('#stationDd').find('.dropdown-menu').html();
    $('#stationDd').find('.dropdown-menu').html(html + "<a class=\"dropdown-item\">" + station.name + "</a>");
});

$('#stationDd').find('.dropdown-menu a').click(function(){
	$('#station').text($(this).text());
	$('#station').val($(this).text());
	let station = stations[$(this).index()-1];
	selectStation(station);
});

function isStation (lat, lon) {
	for(s of stations){
		if(lat == s.latitude && lon == s.longitude) {
			return s.name;
		}
	}
	return undefined;
}
