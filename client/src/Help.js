export default function Help() {
	return (
		<div style={{ 
			padding: '1em',
			margin: '2em',
			border: '2px solid',
			maxWidth: '48em',
			textAlign: 'justify'
		}}>
			<a href='../'>Back to the program</a>
			<h2>Cutoff2050 Geomagentic Rigidity Calculator</h2>
			<p>
				This tool allows one to calculate geomagnetic cutoff rigidity and asymptotic directions for any location around the Earth.
				To do so it simulates trajectories of the negatively charged particles in the magnetosphere,
				detailed explanation of the process can be found in the <a href='#ref'>references</a>.
			</p>
			<b>
				For any questions or suggestions please email to <a href='mailto:izmiran.crdt@gmail.com'>izmiran.crdt@gmail.com</a>
			</b>
			<h2>User manual</h2>
			<h3>1. Running the calculation</h3>
			<p>
				In order to initiate the calculation the user must first input all the desired parameters into the settings window in the middle of the screen and 
				then press the highlighted <i>Compute</i> button. After this a card should appear on the left vertical panel, which corresponds to your new computation
				instance. If it did not appear instantly, do not spam the compute button, wait a bit, then refresh the page and try again, the server may be busy.
				On the card one can see some settings of the instance, the time of its creation (UTC) and the status of the computation including its current progress.
				You may notice that the progress is not at all accurate and may run from 0 to 100 several times (in simple mode especially), so it should not be
				used to estimate the remaining time. Once the calculation is done, the progress bar on the card will appear green and result is available.
				Note that all these instances are persisted in the session on the server, so you can safely close the tab or the browser and come back later to see the result.
				These sessions are cleared automatically after 10 days of inactivity, but you can manually delete unwanted calculations by clicking on the red cross in the top right corner of the card.
			</p>
			<h3>2. About the settings</h3>
			<p>
				The first setting is the calculation mode. Simple mode allows one to calculate the cutoff rigidity without specifying its boundaries
				by automatically identifying the penumbra region. It is generally faster than the advanced mode and gives a fine result within the margin of error.
				The advanced mode allows one to input the rigidity interval and step to compute with and the maximum particle flight time. It can be used for example
				to get a more pleasing penumbra picture, or quickly look at particles trajectories for some specific rigidities.
			</p>
			<p>
				The main parameters used in every calculation are the launch date, coordinates, altitude and direction. One can choose a location from the list
				or input coordinates directly. The allowed altitude ranges from 20 to 36000 kilometers, the vertical angle range from -90 to 90 and the azimuth from 0 to 360.
				For the model of the field 6 options are available, which include simple dipole, IGRF13 and Tsyganenko empirical models combined with IGRF.
				All Tsyganenko models require additional parameters and usually take much more time to calculate. One can find detailed descriptions of these models and
				associated parameters on <a target='_blank' rel='noreferrer' href='https://geo.phys.spbu.ru/~tsyganenko'>the authors website</a>.
			</p>
			<h3>3. Getting the result</h3>
			<p>
				Once the computation is finished one can get its result by clicking the instance card on the left panel, the selected instance will become highlighted.
				The result of the calculator work consists of three views. One that is located under the settings shows the lower, upper and effective cutoff rigidities,
				computation time, and asymptotic directions. Rigidities values for calculating these directions are preprogrammed and trimmed below the resulting cutoff rigidity.
				Below the window with values there is a switch, which changes format to JSON if needed. The second view shows the map of the asymptotic directions, the launch site
				is shown by a red triangle, particles with rigidies more than 10 are drawn with pink color and less than 10 with yellow. You can save this map as an image from your browser.
				And the third view shows the penumbra and the 3 dimensional space model. The penumbra picture is interactive and can be saved as an image aswell. by clicking at any specific particle one can request its
				trajectory to be computed and drawn (this may take several seconds in some cases). To remove trajectories from the picture one can click on their colored descriptions
				in the top left corner of the picture. The 3d view is also interactive, one can move the camera by dragging the cursor over the picture and zoom with scroll.
				In the top right corner there is a switch for the axes helpers and for the camera resetting
				(it is useful to turn it off while comparing several computations results by switching between them).
			</p>
			<h2>Authors</h2>
			<i>
				(email to <a href='mailto:izmiran.crdt@gmail.com'>izmiran.crdt@gmail.com</a>)
			</i>
			<p>
				Semyon Belov - online calculator program
			</p>
			<p>
				Boris Gvozdevsky - trajectory simulation program
			</p>
			<h2 id='ref'>References</h2>
			<div style={{ textIndent: '2em', fontSize: '12px', lineHeight: '1.35em' }}>
				<b style={{ fontSize: '14px' }}>
				Belov, Semen & Zobnin, Egor & Yanke, Victor. (2021). Cutoff rigidity and particle trajectories online calculator. <a target='_blank' rel='noreferrer' href='http://dx.doi.org/10.38072/2748-3150/p24'>http://dx.doi.org/10.38072/2748-3150/p24</a> 
				</b>
				<p>
	Gvozdevsky, B., Dorman L., Abunin, A., Preobrazhensky, M., Gushchina, R.,Belov, A., Eroshenko, E.,Yanke, V., 2015, “Variations of the vertical cut off rigidities for the world wide neutron monitor network over the period of continues monitoring of cosmic rays”, Proc. 34th ICRC,
	Hague, https://pos.sissa.it/236/203/pdf
				</p><p>
	Gvozdevsky, B. B., Abunin, A. A., Kobelev, P. G., Gushchina, R. T., Belov, A. V., Eroshenko. E. A., Yanke, V. G., 2016, Magnetospheric effects of
	cosmic rays. I. Long-term changes in the geomagnetic cutoff rigidities for the stations of the global network of neutron monitors, Geoma-
	gnetism and aeronomy: V. 56, No 4, 381-392, DOI: https://doi.org/10.1134/S0016793216040046
				</p><p>
	Gvozdevsky, B., Belov, A., Gushchina, R., Eroshenko, E., Preobrazhensky, M., Yanke, V., 2017, “The secular variations of cosmic ray cutoff
	rigidities, caused by century variations in geomagnetic field, and cosmic ray variations”, 35th International Cosmic Ray Conference —
	ICRC 2017, 10–20 July, 2017, Bexco, Busan, Korea, https://pos.sissa.it, PoS(ICRC2017)067, 12–20, https://pos.sissa.it/301/067/pdf
				</p><p>
	Gvozdevsky, B. B., Belov, A. V., Gushchina, R. T., Eroshenko, E. A., Kobelev, P. G., Yanke, V. G., 2017, Long-term changes in the vertical rigidity
	of the geomagnetic cutoff over the entire period of monitoring of cosmic rays, „Physics of Auroral Phenomena“ Proc. XL Annual Seminar,
	Apatity, 89-93, http://pgia.ru:81/seminar/archive
				</p><p>
	Gvozdevsky, B. B., Belov, A. V., Gushchina, R. T., Eroshenko, E. A., Danilova, O. A., Yanke, V. G., 2018a, Peculiarities of long-term changes
	in the rigidity of geomagnetic cutoff of cosmic rays of inclined directions, „Physics of Auroral Phenomena“ Proc. 41st Annual Seminar,
	Apatity, 80-83, DOI: https://doi.org/10.25702/KSC.2588-0039.2018.41.80-83
				</p><p>
	Gvozdevsky, B. B., Belov, A.V., Gushchina, R.T., Kobelev, P.G., Eroshenko, E.A., Yanke, V.G., 2018b, “Long-Term Changes in Vertical
	Geomagnetic Cutoff Rigidities of Cosmic Rays”, Physics of Atomic Nuclei, Vol. 81, No. 9, 1382-1389, DOI: https://doi.org/10.1134/
	S1063778818090132
				</p><p>
	Gvozdevsky, B. B., Belov, A. V., Gushchina, R.T., Eroshenko, E.A., Yanke, V.G., 2019, “Planetary long term changes of the cosmic ray geo-
	magnetic cut off rigidities” (26th Extended ECRS + 35th RCRC, Barnaul, Russia, 6-10 July 2018. SH34). Journal of Physics: Conference
	Series, 012008, DOI: https://doi.org/10.1088/1742-6596/1181/1/012008
				</p><p>
	Stormer, C., 1930, On the trajectories of electric particles in the field of magnetic dipole with applications to the theory of cosmic radiation,
	Astrophysics. 1: 237
				</p><p>
	Shea, M.A., Smart, D.F., McCracken K.G., 1965, A study of vertical cutoff rigidities using sixth degree simulations of the geomagnetic field,
	J.Geophys.Res., V. 70. - N 17. - P.4117-4130
				</p><p>
	Shea, M.A., Smart, D.F., 1966, “Vertical cutoff rigidities in the South Atlantic”, Space Res., 6, 177–187
				</p><p>
	Shea, M.A., Smart, D.F., 1967, “Worldwide trajectory-derived vertical cutoff rigidities and their application to experimental measurements
	for 1955”, JGR, V72, No7, 2021-2028
				</p><p>
	Shea, M.A., Smart, D.F., 1975, “A five by fifteen degree world grid of calculated cosmic ray vertical cutoff rigidities for 1965 and 1975”, Proc.
	14th Int. Cosmic Ray Conf., Munchen, 4, 1298-1303
				</p><p>
	Smart, D.F., Shea, M.A., 1994, “Geomagnetic cutoffs: A review for space dosimetry applications”, Adv. Space Res., 14, 10, 787-796
				</p><p>
	Smart, D. F., Shea, M. A., 2001, Geomagnetic Cutoff Rigidity Computer Program: Theory, Software Description and Example, NASA Technical
	Reports Serve, Final Report, 199 pp., 18 January 2001, ID: 20010071975
				</p><p>
	Smart, D.F., Shea, M.A., 2003, “The space developed dynamic vertical cutoff and its applicability to aircraft radiation dose”, Adv. Space Res.,
	32, 1, 103-108
				</p><p>
	Smart, D.F., Shea, M.A., 2007a, “World Grid of Calculated Cosmic Ray Vertical Cutoff Rigidities for Epoch 1995.0”, Proc. 30th ICRC, Mexico,
	V.1 (SH), 733-736
				</p><p>
	Smart, D.F., Shea, M.A., 2007b, “World Grid of Calculated Cosmic Ray Vertical Cutoff Rigidities for Epoch 2000.0”, Proc. 30th ICRC, Mexico,
	V.1 (SH), 737-740
				</p><p>
	Tsyganenko, N. A., 1989, A magnetospheric magnetic field model with a warped tail current sheet, Planet. Space Sci., 37, No. 1, 5-20, DOI:
	https://doi.org/10.1016/0032-0633(89)90066-4
				</p><p>
	Tsyganenko N. A., Stern, D. P., 1996, Modeling the global magnetic field of the large-scale Birkeland current systems, J. Geophys. Res.,
	101, 27187-27198, DOI: https://doi.org/10.1029/98JA02292
				</p><p>
	Tsyganenko, N. A., Singer, H. J., Kasper, J. C., 2003, Storm-time distortion of the inner magnetosphere: How severe can it get?, J. Geo-
	phys. Res., 108, No. A5, 1209, DOI: https://doi.org/10.1029/2002JA009808
				</p><p>
	Tsyganenko, N. A., Sitnov, M. I., 2005, Modeling the dynamics of the inner magnetosphere during strong geomagnetic storms, J. Geo-
	phys. Res. 110, A03208, DOI: https://doi.org/10.1029/2004JA010798
				</p><p>
	Tsyganenko, N.A., 2013, Data-based modelling of the Earth’s dynamic magnetosphere: a review, Ann. Geophys., 31, 1745-1772, DOI:
	https://doi.org/10.5194/angeo-31-1745-2013
				</p>
			</div>
		</div>
	);
}