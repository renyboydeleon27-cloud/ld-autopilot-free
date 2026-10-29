"""Authored production expansion for one byte-exact approved storyboard.

Characters and actions are representative dramatizations, not identified witnesses.
Sources support the event and mechanism, not each staged camera movement.
"""
STORYBOARD_SHA256 = '75dde2562c9a9fea831092a4f21ca6706bb568cf5bcc40a5db80b71285afdd05'
SOURCES = [
    'https://pubmed.ncbi.nlm.nih.gov/17789781/',
    'https://science.nasa.gov/earth-science/programs/research-analysis/lake-nyos-cameroon/',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC1242283/',
]
# Approximately 18–23 words per scene; recording pace, not word count alone,
# determines final duration. No speech is included in the Flow prompt.
NARRATION = [
    'One night in Cameroon, an invisible danger swept through villages near Lake Nyos, leaving homes standing and families devastated.',
    'Before the disaster, communities farmed the hills around Lake Nyos, a crater lake in the northwest of Cameroon.',
    'Deep beneath the surface, carbon dioxide accumulated in the lake water, held in solution by the pressure above.',
    'On August twenty first, nineteen eighty six, the lake suddenly released a huge quantity of its stored carbon dioxide.',
    'Denser than the surrounding air, the gas spread downhill into valleys, exposing nearby communities to a deadly, invisible hazard.',
    'People caught in concentrated carbon dioxide could lose consciousness, overwhelmed by a danger they could neither see nor escape.',
    'The gas reached homes as well as open ground, turning familiar rooms into places of danger without destroying their walls.',
    'Across the affected settlements, the disaster left an extraordinary contrast: buildings still standing, while people and animals lay motionless.',
    'The catastrophe extended beyond the lakeshore into neighboring valleys, killing at least seventeen hundred people and large numbers of livestock.',
    'Some people survived the gas exposure, awakening to loss and confusion in communities where ordinary life had suddenly stopped.',
    'In the aftermath, survivors needed care and assistance as the scale of the catastrophe became clear to the outside world.',
    'Investigators sampled the lake and examined the evidence, searching for an explanation beneath its deceptively calm surface after the disaster.',
    'Their findings pointed to dissolved carbon dioxide released from deep water, rather than a conventional eruption of lava or ash.',
    'For survivors, scientific explanations could not undo the loss of families and neighbors, or restore the lives they had known.',
    'Beginning in two thousand one, controlled degassing removed gas through a pipe, reducing the dangerous accumulation deep inside Lake Nyos.',
    'Lake Nyos remains a reminder that natural danger can be invisible, and that understanding it must go alongside remembrance.',
]
# One action per scene, with framing and temporal continuation rather than cuts.
SHOTS = [
 ('lantern settles in her hand', 'Medium close shot at doorpost height, lantern already unlit; establish her supported posture.', 'Creep forward twenty centimeters as the lantern makes one small gravity-driven swing and settles; her hand stays closed on its handle.', 'Ease camera to rest on the still lantern and supported hand; no collapse or relighting.', 'Soft cloth movement and night breeze; no human vocalization.'),
 ('one villager walks home', 'Wide view from the footpath; select one returning villager as focal subject.', 'Track parallel at walking speed while that villager takes four grounded steps; distant figures remain unobtrusive.', 'Continue the same track as the villager approaches the existing house; preserve afternoon light.', 'Footfalls on earth and a light breeze.'),
 ('camera descends through the water cross-section', 'Establish the approved scientific cutaway, explicitly an explanatory illustration rather than underwater documentary footage.', 'Move the viewpoint slowly downward through the same continuous water column; dissolved gas remains invisible, with no bubbles, lava or labels.', 'Decelerate at the dark deep-water layer; retain the same scale and shoreline geometry.', 'Restrained underwater water movement; no invented explosive sound.'),
 ('lake surface churns', 'Low wide shore view already showing agitated water within the crater walls.', 'Hold the camera fixed as churning water drives overlapping ripples and foam outward; foam follows the surface, not the air.', 'Continue the same turbulence without cutting or inventing a visible gas plume, fire or lava.', 'Churning and splashing water only.'),
 ('camera surveys the descending valley', 'High hillside view aligned with the existing valley floor at night.', 'Tilt downward slowly along the terrain toward the distant village; no visible gas, smoke or animated overlay.', 'Ease the tilt to rest on the low settlement; do not change locations or time of day.', 'Low breeze through nearby leaves.'),
 ('villager settles onto one knee', 'Low three-quarter medium framing; basket already overturned and vegetables stationary.', 'Hold framing while the villager transfers weight onto the planted palm and bent knee; fingers keep ground contact and joints bend naturally.', 'Let the body settle in that supported kneeling position; no second fall or new injury.', 'Cloth brushing and one muted contact with dry earth.'),
 ('camera approaches the still interior', 'Doorway-level medium-wide interior; the mother is already motionless on the floor.', 'Dolly inward very slowly beside the low table, maintaining a respectful distance; person and household objects stay in place.', 'Ease to a stop before the table edge; no recovery, collapse or movement of the body.', 'Faint exterior breeze only; no heartbeat or breathing effects.'),
 ('camera passes the fallen stool', 'Low courtyard view with the stool foreground and motionless adults beyond.', 'Truck gently sideways thirty centimeters, letting the stool create parallax; bodies and buildings remain still and intact.', 'Stop without revealing additional casualties or changing the original composition.', 'Restrained wind over the courtyard.'),
 ('camera follows the valley road visually', 'Elevated wide framing of the winding road, fence and existing still cattle.', 'Slowly pan along the road toward the distant settlement; no cattle movement, vehicles or added figures.', 'Settle on the village while retaining the road in foreground; no aerial jump or zoom transition.', 'Wind across fields only.'),
 ('survivor pushes upright', 'Medium side view at mat height; survivor starts in the approved partly raised posture.', 'Fixed camera as he presses his palms against the mat and straightens his torso slowly; hands bear weight without sliding.', 'Hold his upright position facing the doorway; do not add standing or walking.', 'Mat creak and clothing rustle; no speech or gasps.'),
 ('responders support a slow walk', 'Medium-wide side view of the two responders supporting the survivor beside the road.', 'Track alongside three careful shared steps toward the stationary vehicle; each foot plants before weight transfers.', 'Ease to a stop before the vehicle; no boarding, new interaction or scene change.', 'Slow footsteps on dirt and fabric rustle.'),
 ('scientist lifts a water sample', 'Close shore-level view of a sample container held at the water edge; other researchers remain in the background.', 'Gentle push toward the container as one scientist lifts it level from the water; droplets fall downward and hands keep their grip.', 'Hold the filled container steady; background notes remain illegible and no new equipment appears.', 'Small water drips and shoreline lapping.'),
 ('scientist examines a sample', 'Medium table-level view of the representative field laboratory and three researchers.', 'Fixed camera while one researcher slowly rotates a sealed sample bottle to inspect it; others watch without gesturing or speaking.', 'Bottle rotation stops; liquid settles normally, no glowing chemicals or visible gas inside.', 'Quiet bottle handling against a plain work surface.'),
 ('camera withdraws from the survivor', 'Rear medium view of the survivor standing in the doorway, looking into the empty courtyard.', 'Dolly backward slowly, keeping the survivor centered; doorway edges widen naturally in frame.', 'Settle within the same room; the survivor stays still and belongings remain untouched.', 'Light courtyard breeze and fabric rustle.'),
 ('degassing fountain flows', 'Wide platform view showing the installed pipe and engineers observing; this scene is 2001 onward, not 1986.', 'Slow lateral camera drift while a continuous water jet rises and falls in gravity-shaped arcs; engineers remain stationary.', 'Ease camera to rest as the fountain continues; gas is invisible, with no smoke, steam cloud or explosion.', 'Steady water fountain and splashing on the lake.'),
 ('camera pulls back in remembrance', 'Rear medium-wide view of the survivor already standing with head lowered above the calm lake.', 'Pull back gently fifty centimeters along the same hillside axis; keep lake and survivor stable in frame.', 'Decelerate into a quiet hold; no text, fade, time jump or new gesture.', 'Soft hillside wind and distant water only.'),
]
KEYS = ['HOOK', *[f'P{i}' for i in range(1, 15)], 'ENDING']

def expansion(sha):
    if sha != STORYBOARD_SHA256:
        return {}
    return {key: {'narration': narration, 'motion': (
        f'PRIMARY ACTION: {shot[0]}.\n0–2s: {shot[1]}\n'
        f'2–6s: {shot[2]}\n6–10s: {shot[3]}\nSFX ONLY: {shot[4]}'
    )} for key, narration, shot in zip(KEYS, NARRATION, SHOTS)}
