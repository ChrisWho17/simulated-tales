// =============================================================================
// MICRO-EVENTS CATALOG EXPANSION - 500+ additional events
// Organized by genre with environmental variety
// =============================================================================

import type { CatalogMicroEvent } from './microEventCatalog';

// =============================================================================
// POST-APOCALYPTIC EVENTS (80 events)
// =============================================================================

export const POST_APOCALYPTIC_EVENTS: CatalogMicroEvent[] = [
  // Environmental - Ruins & Decay
  { id: 'PA001', text: 'A rusted shopping cart rolls across the cracked asphalt, pushed by wind that smells of dust and old rain.', location: 'street', timeOfDay: 'afternoon', tensionTier: 2, genre: 'universal', cast: ['player'], reskinnable: true },
  { id: 'PA002', text: 'Faded graffiti on a collapsed wall reads "THEY KNEW" in letters that someone tried to scrub away.', location: 'building', timeOfDay: 'any', tensionTier: 3, genre: 'mystery', cast: ['player'], reskinnable: true },
  { id: 'PA003', text: 'A child\'s doll lies face-down in a puddle, its plastic eyes staring at the clouded sky.', location: 'street', timeOfDay: 'morning', tensionTier: 2, genre: 'drama', cast: ['player'], reskinnable: true },
  { id: 'PA004', text: 'The Geiger counter clicks once, twice, then falls silent, like it changed its mind about something.', location: 'anywhere', timeOfDay: 'any', tensionTier: 3, genre: 'suspense', cast: ['player'], reskinnable: true },
  { id: 'PA005', text: 'An old car horn sounds in the distance, three short blasts, then nothing. Not a pattern you recognize.', location: 'street', timeOfDay: 'afternoon', tensionTier: 3, genre: 'suspense', cast: ['player', 'unknown'], reskinnable: true },
  { id: 'PA006', text: 'Someone has arranged empty water bottles in a line across the road, caps all pointing north.', location: 'street', timeOfDay: 'morning', tensionTier: 2, genre: 'mystery', cast: ['player'], reskinnable: true },
  { id: 'PA007', text: 'A crow lands on a rusted mailbox, caws twice, and flies toward smoke on the horizon.', location: 'neighborhood', timeOfDay: 'afternoon', tensionTier: 2, genre: 'universal', cast: ['player', 'animal'], reskinnable: true },
  { id: 'PA008', text: 'The wind carries whispers of an old radio broadcast, fragments of a world that no longer exists.', location: 'anywhere', timeOfDay: 'evening', tensionTier: 2, genre: 'surreal', cast: ['player'], reskinnable: true },
  { id: 'PA009', text: 'A makeshift grave marker bears no name, just yesterday\'s date scratched into splintered wood.', location: 'park', timeOfDay: 'any', tensionTier: 3, genre: 'drama', cast: ['player'], reskinnable: true },
  { id: 'PA010', text: 'Glass crunches underfoot—not from decay, but from someone who smashed every window on this block recently.', location: 'street', timeOfDay: 'afternoon', tensionTier: 3, genre: 'suspense', cast: ['player'], reskinnable: true },
  
  // Survivor Encounters
  { id: 'PA011', text: 'A figure watches from a rooftop three blocks away, then ducks behind cover when you look up.', location: 'street', timeOfDay: 'afternoon', tensionTier: 4, genre: 'thriller', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'PA012', text: 'Someone left fresh boot prints in the ash, heading the same direction you\'re going.', location: 'street', timeOfDay: 'morning', tensionTier: 3, genre: 'suspense', cast: ['player', 'unknown'], reskinnable: true },
  { id: 'PA013', text: 'A child\'s laughter echoes from somewhere you can\'t pinpoint, then stops abruptly.', location: 'building', timeOfDay: 'afternoon', tensionTier: 4, genre: 'horror_lite', cast: ['player', 'child'], reskinnable: true },
  { id: 'PA014', text: 'An old woman sits in a lawn chair outside a collapsed house, knitting something with wire.', location: 'neighborhood', timeOfDay: 'afternoon', tensionTier: 2, genre: 'surreal', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'PA015', text: 'Two people argue in hushed voices behind a barrier, falling silent when your shadow passes.', location: 'alley', timeOfDay: 'evening', tensionTier: 3, genre: 'mystery', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'PA016', text: 'A trader\'s wagon waits at the crossroads, but the trader is asleep, hand resting on a knife.', location: 'intersection', timeOfDay: 'morning', tensionTier: 2, genre: 'adventure', cast: ['player', 'vendor'], reskinnable: true },
  { id: 'PA017', text: 'Someone painted "SAFE ZONE 12 KM" on a wall, but the arrow points straight into the dead zone.', location: 'street', timeOfDay: 'any', tensionTier: 3, genre: 'mystery', cast: ['player'], reskinnable: true },
  { id: 'PA018', text: 'A dog with a collar but no tags follows you for a block, then vanishes into a collapsed storefront.', location: 'street', timeOfDay: 'afternoon', tensionTier: 2, genre: 'slice_of_life', cast: ['player', 'animal'], reskinnable: true },
  { id: 'PA019', text: 'The scent of cooking meat drifts from somewhere nearby, the first sign of life in hours.', location: 'neighborhood', timeOfDay: 'evening', tensionTier: 2, genre: 'universal', cast: ['player'], reskinnable: true },
  { id: 'PA020', text: 'A hand-painted sign offers "CLEAN WATER - ASK INSIDE" but the building behind it has no door.', location: 'building', timeOfDay: 'afternoon', tensionTier: 3, genre: 'mystery', cast: ['player'], reskinnable: true },
  
  // Scavenging & Resources
  { id: 'PA021', text: 'An unopened can of peaches sits on a windowsill, placed there deliberately, facing outward.', location: 'building', timeOfDay: 'any', tensionTier: 2, genre: 'mystery', cast: ['player'], reskinnable: true },
  { id: 'PA022', text: 'The gas station has been picked clean except for a single pack of batteries, hidden under the counter.', location: 'shop', timeOfDay: 'afternoon', tensionTier: 2, genre: 'universal', cast: ['player'], reskinnable: true },
  { id: 'PA023', text: 'Someone\'s stash is hidden in a hollow tree—three cans, a knife, and a photograph you don\'t look at.', location: 'park', timeOfDay: 'any', tensionTier: 2, genre: 'drama', cast: ['player'], reskinnable: true },
  { id: 'PA024', text: 'A working lighter sits in the middle of the road, either bait or the luckiest find of the week.', location: 'street', timeOfDay: 'morning', tensionTier: 2, genre: 'suspense', cast: ['player'], reskinnable: true },
  { id: 'PA025', text: 'The pharmacy has been looted, but someone left all the vitamins untouched, arranged neatly on the shelf.', location: 'shop', timeOfDay: 'afternoon', tensionTier: 2, genre: 'slice_of_life', cast: ['player'], reskinnable: true },
  { id: 'PA026', text: 'A solar panel on a roof still works, charging nothing, humming to itself in the silence.', location: 'building', timeOfDay: 'afternoon', tensionTier: 1, genre: 'slice_of_life', cast: ['player'], reskinnable: true },
  { id: 'PA027', text: 'Tire tracks in the mud lead to a cache that\'s already been emptied, recently.', location: 'street', timeOfDay: 'morning', tensionTier: 3, genre: 'suspense', cast: ['player'], reskinnable: true },
  { id: 'PA028', text: 'The vending machine still has power, lights flickering, but all the slots are empty except one.', location: 'building', timeOfDay: 'any', tensionTier: 2, genre: 'universal', cast: ['player'], reskinnable: true },
  { id: 'PA029', text: 'A backpack hangs from a fire escape, swaying gently, just out of reach without climbing.', location: 'alley', timeOfDay: 'afternoon', tensionTier: 3, genre: 'suspense', cast: ['player'], reskinnable: true },
  { id: 'PA030', text: 'Someone stripped a car for parts but left the radio intact, tuned to a frequency playing static.', location: 'parking_lot', timeOfDay: 'afternoon', tensionTier: 2, genre: 'mystery', cast: ['player'], reskinnable: true },
  
  // Weather & Atmosphere
  { id: 'PA031', text: 'The sky turns yellow-green at the horizon, the color of warnings no one broadcasts anymore.', location: 'anywhere', timeOfDay: 'afternoon', tensionTier: 3, genre: 'suspense', cast: ['player'], contextHints: ['storm'], reskinnable: true },
  { id: 'PA032', text: 'Ash falls like snow, covering your tracks almost as fast as you make them.', location: 'street', timeOfDay: 'any', tensionTier: 2, genre: 'universal', cast: ['player'], reskinnable: true },
  { id: 'PA033', text: 'The rain tastes wrong—metallic, bitter—and everyone who\'s been out here long enough knows to cover up.', location: 'anywhere', timeOfDay: 'any', tensionTier: 3, genre: 'suspense', cast: ['player'], contextHints: ['rain'], reskinnable: true },
  { id: 'PA034', text: 'A dust devil spins through the intersection, carrying scraps of old newspaper headlines.', location: 'intersection', timeOfDay: 'afternoon', tensionTier: 2, genre: 'surreal', cast: ['player'], reskinnable: true },
  { id: 'PA035', text: 'The fog rolls in thick and fast, erasing the world beyond twenty feet in every direction.', location: 'street', timeOfDay: 'morning', tensionTier: 3, genre: 'horror_lite', cast: ['player'], contextHints: ['fog'], reskinnable: true },
  { id: 'PA036', text: 'Stars are visible through a hole in the permanent cloud cover, the first you\'ve seen in months.', location: 'anywhere', timeOfDay: 'night', tensionTier: 1, genre: 'wholesome', cast: ['player'], reskinnable: true },
  { id: 'PA037', text: 'The temperature drops suddenly, your breath visible, though the calendar says it should be summer.', location: 'anywhere', timeOfDay: 'evening', tensionTier: 2, genre: 'mystery', cast: ['player'], contextHints: ['cold'], reskinnable: true },
  { id: 'PA038', text: 'A rainbow arcs over the wasteland, incongruous and beautiful, making the ruins look like a painting.', location: 'anywhere', timeOfDay: 'afternoon', tensionTier: 1, genre: 'wholesome', cast: ['player'], contextHints: ['rain'], reskinnable: true },
  { id: 'PA039', text: 'The wind changes direction, carrying the smell of fire from somewhere you hoped was abandoned.', location: 'anywhere', timeOfDay: 'evening', tensionTier: 3, genre: 'suspense', cast: ['player'], reskinnable: true },
  { id: 'PA040', text: 'Lightning strikes the same dead tree three times, each flash illuminating fresh footprints nearby.', location: 'park', timeOfDay: 'night', tensionTier: 4, genre: 'horror_lite', cast: ['player'], contextHints: ['storm'], reskinnable: true },
  
  // Settlement Life
  { id: 'PA041', text: 'The guard at the gate nods but doesn\'t lower their weapon, eyes tracking something behind you.', location: 'building', timeOfDay: 'any', tensionTier: 3, genre: 'suspense', cast: ['player', 'authority'], reskinnable: true },
  { id: 'PA042', text: 'Children play with a ball made of wrapped rags, laughing like the world never ended.', location: 'plaza', timeOfDay: 'afternoon', tensionTier: 1, genre: 'wholesome', cast: ['player', 'child'], reskinnable: true },
  { id: 'PA043', text: 'The community board lists three names under "MISSING" with dates from last week.', location: 'building', timeOfDay: 'any', tensionTier: 3, genre: 'drama', cast: ['player'], reskinnable: true },
  { id: 'PA044', text: 'Someone is rationing out water, measuring each portion with medical precision and tired eyes.', location: 'plaza', timeOfDay: 'morning', tensionTier: 2, genre: 'drama', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'PA045', text: 'The generator coughs and sputters, and everyone in earshot holds their breath until it catches again.', location: 'building', timeOfDay: 'evening', tensionTier: 3, genre: 'suspense', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'PA046', text: 'A dog barks once at the perimeter fence, then whines and retreats, tail between its legs.', location: 'anywhere', timeOfDay: 'night', tensionTier: 4, genre: 'horror_lite', cast: ['player', 'animal'], reskinnable: true },
  { id: 'PA047', text: 'The medic looks up from their patient, catches your eye, and shakes their head almost imperceptibly.', location: 'building', timeOfDay: 'any', tensionTier: 4, genre: 'drama', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'PA048', text: 'Someone has painted murals on the shelter walls—scenes from before, impossibly colorful and hopeful.', location: 'building', timeOfDay: 'any', tensionTier: 1, genre: 'wholesome', cast: ['player'], reskinnable: true },
  { id: 'PA049', text: 'The night watch changes shifts in silence, communicating only in hand signals you don\'t fully understand.', location: 'building', timeOfDay: 'night', tensionTier: 2, genre: 'mystery', cast: ['player', 'authority'], reskinnable: true },
  { id: 'PA050', text: 'A couple argues about leaving versus staying, their whispers carrying further than they realize.', location: 'building', timeOfDay: 'night', tensionTier: 2, genre: 'drama', cast: ['player', 'bystanders'], reskinnable: true },
  
  // Danger Signs
  { id: 'PA051', text: 'Trip wire glints in the low light, stretched across the alley at ankle height.', location: 'alley', timeOfDay: 'any', tensionTier: 5, genre: 'thriller', cast: ['player'], reskinnable: true },
  { id: 'PA052', text: 'The building ahead is too quiet—no birds, no wind noise, no settling creaks. Unnatural silence.', location: 'building', timeOfDay: 'any', tensionTier: 4, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'PA053', text: 'Fresh blood on the pavement, still wet, trailing toward a door that hangs open.', location: 'street', timeOfDay: 'any', tensionTier: 5, genre: 'thriller', cast: ['player'], reskinnable: true },
  { id: 'PA054', text: 'A warning shot echoes from somewhere to the east, followed by shouting you can\'t quite make out.', location: 'anywhere', timeOfDay: 'afternoon', tensionTier: 4, genre: 'thriller', cast: ['player', 'unknown'], reskinnable: true },
  { id: 'PA055', text: 'The skull on the signpost isn\'t a symbol—someone mounted it there as a warning.', location: 'street', timeOfDay: 'any', tensionTier: 4, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'PA056', text: 'Glass breaks somewhere above you, and footsteps scramble across a floor you can\'t see.', location: 'building', timeOfDay: 'any', tensionTier: 4, genre: 'suspense', cast: ['player', 'unknown'], reskinnable: true },
  { id: 'PA057', text: 'The fence ahead has been cut, the edges bent outward, like something escaped from inside.', location: 'building', timeOfDay: 'any', tensionTier: 4, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'PA058', text: 'A campfire still smolders, abandoned so recently the coffee pot beside it is warm.', location: 'park', timeOfDay: 'morning', tensionTier: 4, genre: 'suspense', cast: ['player'], reskinnable: true },
  { id: 'PA059', text: 'The path splits, and someone has marked one direction with an X and the other with a skull.', location: 'street', timeOfDay: 'any', tensionTier: 3, genre: 'adventure', cast: ['player'], reskinnable: true },
  { id: 'PA060', text: 'A drone hums overhead, camera lens glinting, belonging to someone who can still afford such things.', location: 'anywhere', timeOfDay: 'afternoon', tensionTier: 4, genre: 'thriller', cast: ['player', 'unknown'], reskinnable: true },
  
  // Hope & Resilience
  { id: 'PA061', text: 'Wildflowers push through the cracked concrete, purple and yellow, stubbornly beautiful.', location: 'street', timeOfDay: 'morning', tensionTier: 1, genre: 'wholesome', cast: ['player'], reskinnable: true },
  { id: 'PA062', text: 'Someone has planted a garden in old tires, tomatoes ripening red against the grey landscape.', location: 'neighborhood', timeOfDay: 'afternoon', tensionTier: 1, genre: 'wholesome', cast: ['player'], reskinnable: true },
  { id: 'PA063', text: 'A bird builds a nest in a rusted traffic light, carrying scraps of colorful cloth in its beak.', location: 'intersection', timeOfDay: 'morning', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'animal'], reskinnable: true },
  { id: 'PA064', text: 'Music plays from an open window—someone teaching a child scales on a salvaged keyboard.', location: 'neighborhood', timeOfDay: 'afternoon', tensionTier: 1, genre: 'wholesome', cast: ['player', 'child', 'stranger'], reskinnable: true },
  { id: 'PA065', text: 'The old library still stands, and someone has reorganized the books by hand, alphabetically.', location: 'building', timeOfDay: 'any', tensionTier: 1, genre: 'slice_of_life', cast: ['player'], reskinnable: true },
  { id: 'PA066', text: 'A group shares a meal in silence, but they make room when they see you watching.', location: 'plaza', timeOfDay: 'evening', tensionTier: 1, genre: 'wholesome', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'PA067', text: 'Someone left a book of poetry propped open on a bench, pages turned to something about hope.', location: 'park', timeOfDay: 'afternoon', tensionTier: 1, genre: 'drama', cast: ['player'], reskinnable: true },
  { id: 'PA068', text: 'A butterfly lands on the barrel of an abandoned gun, wings bright orange against the rust.', location: 'street', timeOfDay: 'afternoon', tensionTier: 1, genre: 'surreal', cast: ['player', 'animal'], reskinnable: true },
  { id: 'PA069', text: 'The sunset paints the ruins gold and rose, almost beautiful enough to forget what they used to be.', location: 'anywhere', timeOfDay: 'evening', tensionTier: 1, genre: 'wholesome', cast: ['player'], reskinnable: true },
  { id: 'PA070', text: 'A dog that\'s been following you finally accepts a pat on the head, tail wagging cautiously.', location: 'anywhere', timeOfDay: 'any', tensionTier: 1, genre: 'wholesome', cast: ['player', 'animal'], reskinnable: true },
  
  // Relics of the Old World
  { id: 'PA071', text: 'A payphone still has a dial tone, connecting to nothing but static and distant clicks.', location: 'street', timeOfDay: 'any', tensionTier: 2, genre: 'surreal', cast: ['player'], reskinnable: true },
  { id: 'PA072', text: 'The movie theater marquee still displays the last film that was showing, letters faded but readable.', location: 'street', timeOfDay: 'any', tensionTier: 2, genre: 'drama', cast: ['player'], reskinnable: true },
  { id: 'PA073', text: 'A calendar on the wall is stuck on the day everything changed, red X marks stopping suddenly.', location: 'building', timeOfDay: 'any', tensionTier: 2, genre: 'drama', cast: ['player'], reskinnable: true },
  { id: 'PA074', text: 'The ATM screen still blinks, asking for a PIN number, as if money still means something.', location: 'street', timeOfDay: 'any', tensionTier: 1, genre: 'surreal', cast: ['player'], reskinnable: true },
  { id: 'PA075', text: 'A child\'s bicycle, pink with streamers, leans against a fence that goes nowhere.', location: 'neighborhood', timeOfDay: 'afternoon', tensionTier: 2, genre: 'drama', cast: ['player'], reskinnable: true },
  { id: 'PA076', text: 'The graduation banner still hangs in the gym, class of a year that never got to celebrate.', location: 'building', timeOfDay: 'any', tensionTier: 2, genre: 'drama', cast: ['player'], reskinnable: true },
  { id: 'PA077', text: 'A refrigerator door is covered in family photos and magnets, life frozen in happier times.', location: 'home', timeOfDay: 'any', tensionTier: 2, genre: 'drama', cast: ['player'], reskinnable: true },
  { id: 'PA078', text: 'The jukebox in the bar still works, playing songs from a world that felt eternal.', location: 'shop', timeOfDay: 'evening', tensionTier: 2, genre: 'drama', cast: ['player'], reskinnable: true },
  { id: 'PA079', text: 'A wedding dress hangs in a shattered store window, white fabric grey with dust but intact.', location: 'storefront', timeOfDay: 'afternoon', tensionTier: 2, genre: 'drama', cast: ['player'], reskinnable: true },
  { id: 'PA080', text: 'The clock tower still chimes on the hour, powered by something that refuses to stop.', location: 'plaza', timeOfDay: 'any', tensionTier: 2, genre: 'surreal', cast: ['player'], reskinnable: true },
];

// =============================================================================
// MODERN URBAN EVENTS (80 events)
// =============================================================================

export const MODERN_URBAN_EVENTS: CatalogMicroEvent[] = [
  // City Life - Morning Rush
  { id: 'MU001', text: 'A commuter misses the train by seconds, and their coffee goes flying in graceful slow motion.', location: 'transit', timeOfDay: 'morning', tensionTier: 1, genre: 'comedy', cast: ['player', 'commuter'], reskinnable: true },
  { id: 'MU002', text: 'The breakfast cart vendor remembers you don\'t like cilantro without being reminded.', location: 'street', timeOfDay: 'morning', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'vendor'], reskinnable: true },
  { id: 'MU003', text: 'Someone rushes past, muttering into their phone about "the Singapore deal," papers scattering behind them.', location: 'street', timeOfDay: 'morning', tensionTier: 1, genre: 'office', cast: ['player', 'commuter'], reskinnable: true },
  { id: 'MU004', text: 'A yoga class practices in the park, all synchronized except one person facing the wrong direction.', location: 'park', timeOfDay: 'morning', tensionTier: 1, genre: 'comedy', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'MU005', text: 'The coffee shop has a new barista who makes elaborate latte art, determined to impress someone specific.', location: 'café', timeOfDay: 'morning', tensionTier: 1, genre: 'romance', cast: ['player', 'barista'], reskinnable: true },
  { id: 'MU006', text: 'A dog walker tangles with six leashes and three different treats, orchestrating chaos with practiced ease.', location: 'park', timeOfDay: 'morning', tensionTier: 1, genre: 'comedy', cast: ['player', 'stranger', 'animal'], reskinnable: true },
  { id: 'MU007', text: 'The newspaper stand owner argues with a pigeon over territory, and the pigeon is winning.', location: 'street', timeOfDay: 'morning', tensionTier: 1, genre: 'comedy', cast: ['player', 'vendor', 'animal'], reskinnable: true },
  { id: 'MU008', text: 'Two neighbors exchange tight smiles over garbage bin placement, a cold war of passive aggression.', location: 'neighborhood', timeOfDay: 'morning', tensionTier: 2, genre: 'drama', cast: ['player', 'neighbor'], reskinnable: true },
  { id: 'MU009', text: 'A street performer tunes their guitar, testing the same three notes while eyeing the best spots.', location: 'plaza', timeOfDay: 'morning', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'busker'], reskinnable: true },
  { id: 'MU010', text: 'The bodega cat yawns from its spot on the counter, unimpressed by the line of customers.', location: 'shop', timeOfDay: 'morning', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'animal'], reskinnable: true },
  
  // Afternoon Bustle
  { id: 'MU011', text: 'Construction workers take lunch on steel beams three stories up, waving down at a tourist taking photos.', location: 'street', timeOfDay: 'afternoon', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'MU012', text: 'A food truck line wraps around the corner, everyone pretending they\'re not watching the competition.', location: 'street', timeOfDay: 'afternoon', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'patrons'], reskinnable: true },
  { id: 'MU013', text: 'Someone proposes in the middle of the crosswalk, traffic frozen in a rare moment of collective patience.', location: 'intersection', timeOfDay: 'afternoon', tensionTier: 1, genre: 'romance', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'MU014', text: 'A delivery driver argues with a GPS that insists this building doesn\'t exist.', location: 'street', timeOfDay: 'afternoon', tensionTier: 1, genre: 'comedy', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'MU015', text: 'Pigeons scatter as a kid on a scooter blazes through, parent shouting apologies in three languages.', location: 'plaza', timeOfDay: 'afternoon', tensionTier: 1, genre: 'comedy', cast: ['player', 'child', 'guardian', 'animal'], reskinnable: true },
  { id: 'MU016', text: 'The ice cream truck plays its tune, and adults pretend they\'re only stopping for the children.', location: 'street', timeOfDay: 'afternoon', tensionTier: 1, genre: 'wholesome', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'MU017', text: 'A window washer waves from fifteen floors up, tiny and distant, somehow cheerful about the view.', location: 'plaza', timeOfDay: 'afternoon', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'MU018', text: 'The sidewalk chalk art has been expanded since morning—someone added a dragon to the hopscotch.', location: 'neighborhood', timeOfDay: 'afternoon', tensionTier: 1, genre: 'wholesome', cast: ['player'], reskinnable: true },
  { id: 'MU019', text: 'A moving truck blocks the entire street, and the neighbors have formed an impromptu welcoming committee.', location: 'street', timeOfDay: 'afternoon', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'neighbor'], reskinnable: true },
  { id: 'MU020', text: 'Two rival food carts face off across the plaza, customers caught in delicious crossfire.', location: 'plaza', timeOfDay: 'afternoon', tensionTier: 2, genre: 'comedy', cast: ['player', 'vendor'], reskinnable: true },
  
  // Evening Transitions
  { id: 'MU021', text: 'Happy hour spills onto the sidewalk, laughter and clinking glasses marking the end of workday stress.', location: 'street', timeOfDay: 'evening', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'patrons'], reskinnable: true },
  { id: 'MU022', text: 'A couple slow dances to busker music while everyone pretends not to watch.', location: 'plaza', timeOfDay: 'evening', tensionTier: 1, genre: 'romance', cast: ['player', 'bystanders', 'busker'], reskinnable: true },
  { id: 'MU023', text: 'The rooftop bar lights flicker on, and for a moment the skyline looks like it\'s made of stars.', location: 'building', timeOfDay: 'evening', tensionTier: 1, genre: 'romance', cast: ['player'], reskinnable: true },
  { id: 'MU024', text: 'Someone walks three rescue dogs of wildly different sizes, a loving logistical nightmare.', location: 'park', timeOfDay: 'evening', tensionTier: 1, genre: 'wholesome', cast: ['player', 'stranger', 'animal'], reskinnable: true },
  { id: 'MU025', text: 'The gym across the street shows rows of silhouettes on treadmills, all running toward nothing.', location: 'street', timeOfDay: 'evening', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'MU026', text: 'A street artist finishes a mural as the sun sets, stepping back to admire it with paint-stained hands.', location: 'street', timeOfDay: 'evening', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'MU027', text: 'The flower shop owner gives away the last bouquet to a passerby who looks like they need it.', location: 'storefront', timeOfDay: 'evening', tensionTier: 1, genre: 'wholesome', cast: ['player', 'vendor', 'stranger'], reskinnable: true },
  { id: 'MU028', text: 'Takeout containers pile up in apartment windows like modern still life paintings of exhaustion.', location: 'neighborhood', timeOfDay: 'evening', tensionTier: 1, genre: 'slice_of_life', cast: ['player'], reskinnable: true },
  { id: 'MU029', text: 'A saxophone player sets up in the subway tunnel, the first note echoing like a question.', location: 'transit', timeOfDay: 'evening', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'busker'], reskinnable: true },
  { id: 'MU030', text: 'The deli stays open late, regulars gathering to argue about sports and solve the world\'s problems.', location: 'shop', timeOfDay: 'evening', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'patrons'], reskinnable: true },
  
  // Night Life
  { id: 'MU031', text: 'A club\'s bass thumps through the sidewalk, feet feeling the beat before ears hear it.', location: 'street', timeOfDay: 'night', tensionTier: 2, genre: 'universal', cast: ['player'], reskinnable: true },
  { id: 'MU032', text: 'The late-night pizza slice is perfect—crispy, greasy, and exactly what everyone in line needed.', location: 'shop', timeOfDay: 'night', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'patrons'], reskinnable: true },
  { id: 'MU033', text: 'A cab driver tells stories while waiting at the light, hands dancing as he describes his hometown.', location: 'street', timeOfDay: 'night', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'MU034', text: 'Someone drunkenly serenades a fire hydrant, friends filming and laughing supportively.', location: 'street', timeOfDay: 'night', tensionTier: 1, genre: 'comedy', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'MU035', text: 'The 24-hour diner is half empty, but every table has a story that would take until morning to tell.', location: 'café', timeOfDay: 'late_night', tensionTier: 1, genre: 'drama', cast: ['player', 'patrons'], reskinnable: true },
  { id: 'MU036', text: 'A convenience store clerk reads a novel between customers, marking their page with a receipt.', location: 'shop', timeOfDay: 'late_night', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'clerk'], reskinnable: true },
  { id: 'MU037', text: 'The subway car is nearly empty, just you and a tired nurse heading home after a long shift.', location: 'transit', timeOfDay: 'late_night', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'MU038', text: 'A cat café\'s window reveals cats sleeping in impossible positions, unbothered by the world outside.', location: 'storefront', timeOfDay: 'night', tensionTier: 1, genre: 'wholesome', cast: ['player', 'animal'], reskinnable: true },
  { id: 'MU039', text: 'Steam rises from a manhole cover, theatrical and mysterious in the streetlight glow.', location: 'street', timeOfDay: 'night', tensionTier: 2, genre: 'noir', cast: ['player'], reskinnable: true },
  { id: 'MU040', text: 'A street cleaner hums to themselves, making neat patterns in the empty intersection.', location: 'intersection', timeOfDay: 'late_night', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'stranger'], reskinnable: true },
  
  // Urban Mystery
  { id: 'MU041', text: 'The apartment above yours has new tenants, but you\'ve never seen them—only heard their footsteps.', location: 'apartment', timeOfDay: 'any', tensionTier: 2, genre: 'mystery', cast: ['player', 'neighbor'], reskinnable: true },
  { id: 'MU042', text: 'A business card on the ground has only a phone number and a single word: "When."', location: 'street', timeOfDay: 'afternoon', tensionTier: 3, genre: 'mystery', cast: ['player'], reskinnable: true },
  { id: 'MU043', text: 'The same man has been reading the same newspaper at the same café table for three days.', location: 'café', timeOfDay: 'afternoon', tensionTier: 3, genre: 'noir', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'MU044', text: 'Graffiti appeared overnight on the pristine wall: "THEY CHANGED THE LOCKS BUT NOT THE GAME."', location: 'alley', timeOfDay: 'morning', tensionTier: 2, genre: 'mystery', cast: ['player'], reskinnable: true },
  { id: 'MU045', text: 'A black SUV has circled the block three times, windows too dark to see inside.', location: 'street', timeOfDay: 'afternoon', tensionTier: 4, genre: 'thriller', cast: ['player', 'unknown'], reskinnable: true },
  { id: 'MU046', text: 'The elevator stops at every floor on the way up, doors opening to empty hallways each time.', location: 'building', timeOfDay: 'any', tensionTier: 3, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'MU047', text: 'Your neighbor\'s mail has been piling up for a week, but someone keeps leaving fresh flowers at the door.', location: 'hallway', timeOfDay: 'any', tensionTier: 3, genre: 'mystery', cast: ['player'], reskinnable: true },
  { id: 'MU048', text: 'A pay phone rings as you pass, insistent and impossible—pay phones haven\'t worked here in years.', location: 'street', timeOfDay: 'evening', tensionTier: 4, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'MU049', text: 'The reflection in the store window shows someone standing behind you, but when you turn, no one\'s there.', location: 'storefront', timeOfDay: 'evening', tensionTier: 4, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'MU050', text: 'A stranger presses a USB drive into your hand, whispers "You\'ll know when," and disappears into the crowd.', location: 'transit', timeOfDay: 'afternoon', tensionTier: 4, genre: 'thriller', cast: ['player', 'stranger'], reskinnable: true },
  
  // Office & Workplace
  { id: 'MU051', text: 'The office printer jams at the worst moment, and three people converge with different theories.', location: 'workplace', timeOfDay: 'afternoon', tensionTier: 1, genre: 'office', cast: ['player', 'coworker'], reskinnable: true },
  { id: 'MU052', text: 'Someone microwaved fish again, and the silent war in the break room reaches new heights.', location: 'workplace', timeOfDay: 'afternoon', tensionTier: 1, genre: 'comedy', cast: ['player', 'coworker'], reskinnable: true },
  { id: 'MU053', text: 'The new hire already knows everyone\'s coffee order, which is either impressive or concerning.', location: 'workplace', timeOfDay: 'morning', tensionTier: 2, genre: 'office', cast: ['player', 'coworker'], reskinnable: true },
  { id: 'MU054', text: 'A meeting ends early, and the collective relief is almost visible in the hallway afterward.', location: 'workplace', timeOfDay: 'afternoon', tensionTier: 1, genre: 'office', cast: ['player', 'coworker'], reskinnable: true },
  { id: 'MU055', text: 'Someone decorated their cubicle for a holiday that\'s three weeks away, and no one has the heart to say.', location: 'workplace', timeOfDay: 'afternoon', tensionTier: 1, genre: 'comedy', cast: ['player', 'coworker'], reskinnable: true },
  { id: 'MU056', text: 'The vending machine in the lobby dispensed the wrong thing, and the winner and loser silently trade.', location: 'lobby', timeOfDay: 'afternoon', tensionTier: 1, genre: 'comedy', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'MU057', text: 'IT sends an email about a "routine system check," and everyone saves their work simultaneously.', location: 'workplace', timeOfDay: 'afternoon', tensionTier: 2, genre: 'office', cast: ['player', 'coworker'], reskinnable: true },
  { id: 'MU058', text: 'The elevator small talk reaches new depths of awkwardness when both parties realize they were on mute.', location: 'building', timeOfDay: 'afternoon', tensionTier: 1, genre: 'comedy', cast: ['player', 'coworker'], reskinnable: true },
  { id: 'MU059', text: 'Someone brought their dog to the office, productivity dropped 40%, and morale increased 200%.', location: 'workplace', timeOfDay: 'afternoon', tensionTier: 1, genre: 'wholesome', cast: ['player', 'coworker', 'animal'], reskinnable: true },
  { id: 'MU060', text: 'The CEO walks through, says good morning to everyone, and nobody knows what it means.', location: 'workplace', timeOfDay: 'morning', tensionTier: 2, genre: 'office', cast: ['player', 'authority'], reskinnable: true },
  
  // Technology & Modern Life
  { id: 'MU061', text: 'Your phone battery dies at 23%, and trust is shattered in a way that feels personal.', location: 'anywhere', timeOfDay: 'any', tensionTier: 1, genre: 'comedy', cast: ['player'], reskinnable: true },
  { id: 'MU062', text: 'The WiFi password is posted on the wall, but someone wrote it in a font that makes 0s and Os identical.', location: 'café', timeOfDay: 'any', tensionTier: 1, genre: 'comedy', cast: ['player'], reskinnable: true },
  { id: 'MU063', text: 'A rideshare drops someone off, and they\'ve been rating the driver the entire walk to the door.', location: 'street', timeOfDay: 'evening', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'MU064', text: 'The charger at the café works, and strangers bond over the outlet like pioneers around a fire.', location: 'café', timeOfDay: 'afternoon', tensionTier: 1, genre: 'comedy', cast: ['player', 'patrons'], reskinnable: true },
  { id: 'MU065', text: 'A drone delivery overshoots its target, package dangling from a tree while the owner argues with an app.', location: 'neighborhood', timeOfDay: 'afternoon', tensionTier: 1, genre: 'comedy', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'MU066', text: 'Someone\'s smart speaker activates through the window, offering weather updates to the entire street.', location: 'neighborhood', timeOfDay: 'morning', tensionTier: 1, genre: 'comedy', cast: ['player'], reskinnable: true },
  { id: 'MU067', text: 'The ATM gives you $20 extra, and the moral debate lasts longer than the transaction.', location: 'street', timeOfDay: 'any', tensionTier: 2, genre: 'drama', cast: ['player'], reskinnable: true },
  { id: 'MU068', text: 'A QR code on a poster leads to a video of a cat, and somehow this feels like the best possible outcome.', location: 'street', timeOfDay: 'any', tensionTier: 1, genre: 'comedy', cast: ['player'], reskinnable: true },
  { id: 'MU069', text: 'The building\'s smart thermostat and a tenant are locked in a cold war that\'s literally about temperature.', location: 'building', timeOfDay: 'afternoon', tensionTier: 1, genre: 'comedy', cast: ['player'], reskinnable: true },
  { id: 'MU070', text: 'A group video call continues on a laptop carried through the coffee shop, participants pretending normalcy.', location: 'café', timeOfDay: 'afternoon', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'stranger'], reskinnable: true },
  
  // Neighborhood Characters
  { id: 'MU071', text: 'The old man who feeds pigeons has named them all, and introduces you to "Gerald" specifically.', location: 'park', timeOfDay: 'morning', tensionTier: 1, genre: 'wholesome', cast: ['player', 'stranger', 'animal'], reskinnable: true },
  { id: 'MU072', text: 'A community garden plot shows tomatoes labeled "DO NOT TOUCH - I WILL KNOW," which feels credible.', location: 'park', timeOfDay: 'afternoon', tensionTier: 1, genre: 'comedy', cast: ['player'], reskinnable: true },
  { id: 'MU073', text: 'The bookstore owner recommends something "just for you," and it\'s uncomfortably accurate.', location: 'shop', timeOfDay: 'afternoon', tensionTier: 2, genre: 'slice_of_life', cast: ['player', 'vendor'], reskinnable: true },
  { id: 'MU074', text: 'A local artist paints the same corner every day, each canvas slightly different, none ever sold.', location: 'street', timeOfDay: 'afternoon', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'MU075', text: 'The diner\'s regular orders their "usual" in a tone that suggests they\'ve been coming here for decades.', location: 'café', timeOfDay: 'morning', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'patrons'], reskinnable: true },
  { id: 'MU076', text: 'A chess game in the park has drawn a crowd—the old rivals have been at it for four hours.', location: 'park', timeOfDay: 'afternoon', tensionTier: 2, genre: 'drama', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'MU077', text: 'The superintendent fixes everything with duct tape and philosophy, equally effective at both.', location: 'building', timeOfDay: 'any', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'MU078', text: 'A retired couple walks the same route every evening, holding hands like they just discovered the option.', location: 'park', timeOfDay: 'evening', tensionTier: 1, genre: 'wholesome', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'MU079', text: 'The woman who runs the corner store knows everyone\'s birthday and seems mildly hurt if you forget.', location: 'shop', timeOfDay: 'any', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'vendor'], reskinnable: true },
  { id: 'MU080', text: 'A street musician plays the same song as yesterday, but today someone joins in with a harmonica.', location: 'plaza', timeOfDay: 'evening', tensionTier: 1, genre: 'wholesome', cast: ['player', 'busker'], reskinnable: true },
];

// =============================================================================
// HORROR EVENTS (60 events)
// =============================================================================

export const HORROR_EVENTS: CatalogMicroEvent[] = [
  // Subtle Unease
  { id: 'HO001', text: 'The shadow under the door doesn\'t match anyone who should be standing there.', location: 'hallway', timeOfDay: 'night', tensionTier: 4, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'HO002', text: 'A child\'s laughter echoes from the empty playground, carried on wind that isn\'t blowing.', location: 'park', timeOfDay: 'dusk', tensionTier: 4, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'HO003', text: 'The mirror reflects the room correctly except for one detail you can\'t quite identify.', location: 'home', timeOfDay: 'night', tensionTier: 4, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'HO004', text: 'Your footsteps echo twice—once when you step, and once a half-second later.', location: 'hallway', timeOfDay: 'night', tensionTier: 4, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'HO005', text: 'The radio clicks on by itself, tuned to static that almost sounds like words.', location: 'home', timeOfDay: 'late_night', tensionTier: 4, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'HO006', text: 'A photograph you\'ve seen a hundred times has changed—someone is standing in the background now.', location: 'home', timeOfDay: 'any', tensionTier: 5, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'HO007', text: 'The dog stares at the corner of the ceiling, hackles raised, growling at something you can\'t see.', location: 'home', timeOfDay: 'night', tensionTier: 4, genre: 'horror_lite', cast: ['player', 'animal'], reskinnable: true },
  { id: 'HO008', text: 'Every clock in the house reads 3:33, though you set them all to different times.', location: 'home', timeOfDay: 'late_night', tensionTier: 4, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'HO009', text: 'The bathroom mirror fogs over, and something writes itself in the condensation.', location: 'home', timeOfDay: 'night', tensionTier: 5, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'HO010', text: 'A phone rings somewhere in the house, but you disconnected the landline years ago.', location: 'home', timeOfDay: 'late_night', tensionTier: 4, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  
  // Environmental Dread
  { id: 'HO011', text: 'The streetlight flickers and dies as you pass, leaving you in a pool of sudden darkness.', location: 'street', timeOfDay: 'night', tensionTier: 3, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'HO012', text: 'Fog rolls in thick and fast, and the buildings you know should be there are simply gone.', location: 'street', timeOfDay: 'night', tensionTier: 4, genre: 'horror_lite', cast: ['player'], contextHints: ['fog'], reskinnable: true },
  { id: 'HO013', text: 'The trees in the park have all bent the same direction, away from something at the center.', location: 'park', timeOfDay: 'evening', tensionTier: 4, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'HO014', text: 'A cold spot passes through you, temperature dropping twenty degrees for just a heartbeat.', location: 'anywhere', timeOfDay: 'any', tensionTier: 3, genre: 'supernatural_lean', cast: ['player'], reskinnable: true },
  { id: 'HO015', text: 'The crows have gathered in impossible numbers, watching in absolute silence.', location: 'park', timeOfDay: 'dusk', tensionTier: 4, genre: 'horror_lite', cast: ['player', 'animal'], reskinnable: true },
  { id: 'HO016', text: 'Rain falls in a perfect circle around a spot on the sidewalk, leaving it completely dry.', location: 'street', timeOfDay: 'evening', tensionTier: 4, genre: 'supernatural_lean', cast: ['player'], contextHints: ['rain'], reskinnable: true },
  { id: 'HO017', text: 'The church bells ring at the wrong hour, and the sound seems to come from underground.', location: 'street', timeOfDay: 'night', tensionTier: 4, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'HO018', text: 'Every cat on the block is sitting on the same side of the street, facing the same empty house.', location: 'neighborhood', timeOfDay: 'dusk', tensionTier: 4, genre: 'horror_lite', cast: ['player', 'animal'], reskinnable: true },
  { id: 'HO019', text: 'The graveyard gate stands open, though the groundskeeper swears he locked it an hour ago.', location: 'park', timeOfDay: 'night', tensionTier: 4, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'HO020', text: 'A window on the third floor of the abandoned building lights up, then quickly goes dark.', location: 'street', timeOfDay: 'night', tensionTier: 4, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  
  // Encounters
  { id: 'HO021', text: 'A stranger walks past, and their shadow doesn\'t move with them—it stays, watching.', location: 'street', timeOfDay: 'evening', tensionTier: 5, genre: 'horror_lite', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'HO022', text: 'The woman at the bus stop asks what year it is, and doesn\'t seem satisfied with the answer.', location: 'transit', timeOfDay: 'evening', tensionTier: 3, genre: 'supernatural_lean', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'HO023', text: 'A child waves from the playground at 2 AM, then turns and walks into the darkness between the trees.', location: 'park', timeOfDay: 'late_night', tensionTier: 5, genre: 'horror_lite', cast: ['player', 'child'], reskinnable: true },
  { id: 'HO024', text: 'Someone is following you, matching your pace exactly, but no matter how fast you turn, you can\'t see them.', location: 'street', timeOfDay: 'night', tensionTier: 5, genre: 'horror_lite', cast: ['player', 'unknown'], reskinnable: true },
  { id: 'HO025', text: 'The homeless man on the corner speaks your name as you pass, though you\'ve never met.', location: 'street', timeOfDay: 'evening', tensionTier: 4, genre: 'horror_lite', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'HO026', text: 'A figure stands at the end of the alley, perfectly still, head tilted at an unnatural angle.', location: 'alley', timeOfDay: 'night', tensionTier: 5, genre: 'horror_lite', cast: ['player', 'unknown'], reskinnable: true },
  { id: 'HO027', text: 'The librarian smiles when you check out the occult section, and whispers, "You\'re ready."', location: 'building', timeOfDay: 'afternoon', tensionTier: 3, genre: 'supernatural_lean', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'HO028', text: 'A group of people in old-fashioned clothes walks past without acknowledging you—or casting shadows.', location: 'street', timeOfDay: 'dusk', tensionTier: 5, genre: 'supernatural_lean', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'HO029', text: 'The taxi driver says he remembers you from last week, but you\'ve never taken a taxi before.', location: 'transit', timeOfDay: 'night', tensionTier: 4, genre: 'horror_lite', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'HO030', text: 'A face appears at the window as you pass the abandoned house, gone before you can focus.', location: 'street', timeOfDay: 'dusk', tensionTier: 5, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  
  // Objects & Spaces
  { id: 'HO031', text: 'The door you just locked is open again, the lock intact, as if it was never touched.', location: 'home', timeOfDay: 'night', tensionTier: 4, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'HO032', text: 'A doll\'s head lies in the gutter, its painted eyes following you as you walk past.', location: 'street', timeOfDay: 'evening', tensionTier: 3, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'HO033', text: 'The elevator skips a floor that you know exists—the button for it is simply missing now.', location: 'building', timeOfDay: 'any', tensionTier: 3, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'HO034', text: 'A book falls off the shelf, open to a page with your name written in the margin.', location: 'home', timeOfDay: 'night', tensionTier: 4, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'HO035', text: 'The basement light is on, throwing long shadows up the stairs, though no one has been down there.', location: 'home', timeOfDay: 'night', tensionTier: 4, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'HO036', text: 'A rocking chair on the porch moves gently, though there\'s no wind and no one sitting in it.', location: 'home', timeOfDay: 'evening', tensionTier: 3, genre: 'supernatural_lean', cast: ['player'], reskinnable: true },
  { id: 'HO037', text: 'The painting\'s eyes have always followed you, but today they seem to be looking at something behind you.', location: 'building', timeOfDay: 'any', tensionTier: 4, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'HO038', text: 'Scratching sounds come from inside the walls, moving from room to room as you try to locate them.', location: 'home', timeOfDay: 'late_night', tensionTier: 4, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'HO039', text: 'The attic hatch is open, though you haven\'t touched it, and a cold draft whispers down.', location: 'home', timeOfDay: 'night', tensionTier: 4, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'HO040', text: 'A music box plays in the antique store, the tune hauntingly familiar from a dream you\'ve had.', location: 'shop', timeOfDay: 'afternoon', tensionTier: 3, genre: 'supernatural_lean', cast: ['player'], reskinnable: true },
  
  // Unsettling Details
  { id: 'HO041', text: 'The smell of flowers fills the room, though nothing is blooming—the scent of funeral arrangements.', location: 'home', timeOfDay: 'any', tensionTier: 3, genre: 'supernatural_lean', cast: ['player'], reskinnable: true },
  { id: 'HO042', text: 'Handprints appear on the inside of the frost-covered window, too small to be adult hands.', location: 'home', timeOfDay: 'morning', tensionTier: 4, genre: 'horror_lite', cast: ['player'], contextHints: ['cold'], reskinnable: true },
  { id: 'HO043', text: 'The calendar shows today\'s date, but the calendar itself is from a year that hasn\'t happened yet.', location: 'home', timeOfDay: 'any', tensionTier: 4, genre: 'surreal', cast: ['player'], reskinnable: true },
  { id: 'HO044', text: 'A voicemail on your phone, left while you were sleeping, contains only your own voice, screaming.', location: 'anywhere', timeOfDay: 'morning', tensionTier: 5, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'HO045', text: 'The neighbor\'s garden gnomes have moved, all facing your window, though you never saw anyone touch them.', location: 'neighborhood', timeOfDay: 'morning', tensionTier: 3, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'HO046', text: 'A bird flies into the window and falls—but there\'s no body when you go outside to check.', location: 'home', timeOfDay: 'afternoon', tensionTier: 3, genre: 'supernatural_lean', cast: ['player', 'animal'], reskinnable: true },
  { id: 'HO047', text: 'The stairs creak in sequence, as if someone is walking up them, though no one is there.', location: 'home', timeOfDay: 'late_night', tensionTier: 4, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'HO048', text: 'Every reflection in the house shows the room from a slightly different angle than it should.', location: 'home', timeOfDay: 'evening', tensionTier: 4, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'HO049', text: 'The pet fish have all died overnight, arranged in a perfect circle at the bottom of the tank.', location: 'home', timeOfDay: 'morning', tensionTier: 4, genre: 'horror_lite', cast: ['player', 'animal'], reskinnable: true },
  { id: 'HO050', text: 'A name appears on your forearm, written in pen you don\'t own, in handwriting that isn\'t yours.', location: 'anywhere', timeOfDay: 'any', tensionTier: 5, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  
  // Building Tension
  { id: 'HO051', text: 'The power flickers throughout the neighborhood, except for one house that stays dark the entire time.', location: 'neighborhood', timeOfDay: 'night', tensionTier: 3, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'HO052', text: 'A scream in the distance, cut short, and the silence that follows feels intentional.', location: 'street', timeOfDay: 'late_night', tensionTier: 5, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'HO053', text: 'The newspaper clipping you found describes an accident that will happen tomorrow.', location: 'home', timeOfDay: 'any', tensionTier: 5, genre: 'supernatural_lean', cast: ['player'], reskinnable: true },
  { id: 'HO054', text: 'All the birds leave the trees at once, in complete silence, heading in the same direction.', location: 'park', timeOfDay: 'dusk', tensionTier: 4, genre: 'horror_lite', cast: ['player', 'animal'], reskinnable: true },
  { id: 'HO055', text: 'A trail of wet footprints leads from the front door to your bedroom, though you\'ve been home all night.', location: 'home', timeOfDay: 'late_night', tensionTier: 5, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'HO056', text: 'The emergency alert on your phone describes an emergency in your building that hasn\'t happened yet.', location: 'home', timeOfDay: 'any', tensionTier: 5, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'HO057', text: 'Every door in the hallway is open except yours, and you can hear something moving from room to room.', location: 'hallway', timeOfDay: 'night', tensionTier: 5, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'HO058', text: 'The baby monitor picks up sounds from a house that\'s been empty for years.', location: 'home', timeOfDay: 'late_night', tensionTier: 5, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'HO059', text: 'Your reflection blinks before you do, just once, and then acts normal again.', location: 'home', timeOfDay: 'night', tensionTier: 5, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'HO060', text: 'The last text message on your phone is from yourself, sent tomorrow, saying only "Don\'t trust them."', location: 'anywhere', timeOfDay: 'any', tensionTier: 5, genre: 'horror_lite', cast: ['player'], reskinnable: true },
];

// =============================================================================
// NOIR EVENTS (60 events)
// =============================================================================

export const NOIR_EVENTS: CatalogMicroEvent[] = [
  // Atmosphere
  { id: 'NO001', text: 'Rain streaks the window in patterns that almost spell out words, then rearrange.', location: 'building', timeOfDay: 'night', tensionTier: 2, genre: 'noir', cast: ['player'], contextHints: ['rain'], reskinnable: true },
  { id: 'NO002', text: 'A saxophone plays somewhere below, notes curling through the steam rising from the grates.', location: 'street', timeOfDay: 'night', tensionTier: 2, genre: 'noir', cast: ['player'], reskinnable: true },
  { id: 'NO003', text: 'The neon sign flickers your name—or something close enough to make you look twice.', location: 'street', timeOfDay: 'night', tensionTier: 3, genre: 'noir', cast: ['player'], reskinnable: true },
  { id: 'NO004', text: 'Smoke curls from an ashtray in the empty office, the cigarette still burning.', location: 'workplace', timeOfDay: 'night', tensionTier: 3, genre: 'noir', cast: ['player'], reskinnable: true },
  { id: 'NO005', text: 'The bartender pours without asking, already knowing what you need before you sit down.', location: 'café', timeOfDay: 'night', tensionTier: 2, genre: 'noir', cast: ['player', 'barista'], reskinnable: true },
  { id: 'NO006', text: 'A black sedan idles across the street, exhaust curling like questions into the cold air.', location: 'street', timeOfDay: 'evening', tensionTier: 3, genre: 'noir', cast: ['player', 'unknown'], reskinnable: true },
  { id: 'NO007', text: 'The fedora on the coat rack isn\'t yours, but it fits perfectly, and it smells like trouble.', location: 'building', timeOfDay: 'any', tensionTier: 2, genre: 'noir', cast: ['player'], reskinnable: true },
  { id: 'NO008', text: 'Venetian blinds cast prison-bar shadows across the desk, appropriate for the paperwork there.', location: 'workplace', timeOfDay: 'afternoon', tensionTier: 2, genre: 'noir', cast: ['player'], reskinnable: true },
  { id: 'NO009', text: 'The radio announces a death that hasn\'t been discovered yet—someone knows something.', location: 'building', timeOfDay: 'evening', tensionTier: 4, genre: 'noir', cast: ['player'], reskinnable: true },
  { id: 'NO010', text: 'A woman in red passes by, leaving a trail of perfume that triggers a memory you can\'t place.', location: 'street', timeOfDay: 'evening', tensionTier: 2, genre: 'noir', cast: ['player', 'stranger'], reskinnable: true },
  
  // Suspicious Activity
  { id: 'NO011', text: 'Two men exchange briefcases under the streetlight, their choreography too smooth to be innocent.', location: 'street', timeOfDay: 'night', tensionTier: 4, genre: 'noir', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'NO012', text: 'The pawnshop window displays items that shouldn\'t be for sale, including one you recognize.', location: 'storefront', timeOfDay: 'any', tensionTier: 3, genre: 'noir', cast: ['player'], reskinnable: true },
  { id: 'NO013', text: 'A car backfires three blocks away, and everyone on this block reaches for something.', location: 'street', timeOfDay: 'night', tensionTier: 4, genre: 'noir', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'NO014', text: 'The casino\'s back room door opens as you pass, voices falling silent in a meaningful way.', location: 'building', timeOfDay: 'night', tensionTier: 3, genre: 'noir', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'NO015', text: 'A hand-delivered envelope waits on your desk, no postage, no return address, warm from someone\'s pocket.', location: 'workplace', timeOfDay: 'morning', tensionTier: 3, genre: 'noir', cast: ['player'], reskinnable: true },
  { id: 'NO016', text: 'The diner\'s night shift watches you eat like they\'re cataloguing information for someone.', location: 'café', timeOfDay: 'late_night', tensionTier: 3, genre: 'noir', cast: ['player', 'patrons'], reskinnable: true },
  { id: 'NO017', text: 'A photograph slips under your door—it\'s you, taken yesterday, from across the street.', location: 'apartment', timeOfDay: 'night', tensionTier: 4, genre: 'noir', cast: ['player', 'unknown'], reskinnable: true },
  { id: 'NO018', text: 'The phone booth on the corner has been ringing every night at 11 PM, and no one answers.', location: 'street', timeOfDay: 'night', tensionTier: 3, genre: 'noir', cast: ['player'], reskinnable: true },
  { id: 'NO019', text: 'A matchbook from a club that closed ten years ago shows up in your jacket pocket.', location: 'anywhere', timeOfDay: 'any', tensionTier: 3, genre: 'noir', cast: ['player'], reskinnable: true },
  { id: 'NO020', text: 'The morgue report lists a name you recognize, cause of death conspicuously vague.', location: 'building', timeOfDay: 'afternoon', tensionTier: 4, genre: 'noir', cast: ['player'], reskinnable: true },
  
  // Characters
  { id: 'NO021', text: 'The blonde at the bar orders the same drink you did, then says it\'s not a coincidence.', location: 'café', timeOfDay: 'night', tensionTier: 3, genre: 'noir', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'NO022', text: 'An old contact finds you, claiming he\'s been dead for three years, officially speaking.', location: 'street', timeOfDay: 'evening', tensionTier: 4, genre: 'noir', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'NO023', text: 'The cop on the beat tips his hat, a warning in his eyes that doesn\'t match his smile.', location: 'street', timeOfDay: 'evening', tensionTier: 3, genre: 'noir', cast: ['player', 'authority'], reskinnable: true },
  { id: 'NO024', text: 'A child delivers a message in a voice too flat, then disappears into an alley.', location: 'street', timeOfDay: 'afternoon', tensionTier: 4, genre: 'noir', cast: ['player', 'child'], reskinnable: true },
  { id: 'NO025', text: 'The widow in black visits the same grave every day, and the headstone has no name.', location: 'park', timeOfDay: 'morning', tensionTier: 3, genre: 'noir', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'NO026', text: 'Your secretary hasn\'t come in for three days, but the typewriter keys are still warm.', location: 'workplace', timeOfDay: 'morning', tensionTier: 4, genre: 'noir', cast: ['player'], reskinnable: true },
  { id: 'NO027', text: 'The informant in the corner booth talks to his coffee, but his eyes are tracking the door.', location: 'café', timeOfDay: 'evening', tensionTier: 3, genre: 'noir', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'NO028', text: 'A man with a limp follows you for three blocks, then vanishes when you turn to confront him.', location: 'street', timeOfDay: 'night', tensionTier: 4, genre: 'noir', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'NO029', text: 'The journalist who was asking questions shows up at your door, saying she needs to hide.', location: 'apartment', timeOfDay: 'night', tensionTier: 4, genre: 'noir', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'NO030', text: 'A voice on the other end of a wrong-number call says your name before hanging up.', location: 'anywhere', timeOfDay: 'any', tensionTier: 4, genre: 'noir', cast: ['player', 'unknown'], reskinnable: true },
  
  // Evidence & Clues
  { id: 'NO031', text: 'A newspaper clipping about a missing person has been left in your mailbox, circled in red.', location: 'building', timeOfDay: 'morning', tensionTier: 3, genre: 'noir', cast: ['player'], reskinnable: true },
  { id: 'NO032', text: 'The trash in the alley includes a torn photo—only the hands are visible, holding something small.', location: 'alley', timeOfDay: 'any', tensionTier: 3, genre: 'noir', cast: ['player'], reskinnable: true },
  { id: 'NO033', text: 'A key arrives in plain packaging, fitting a lock you haven\'t seen but somehow recognize.', location: 'building', timeOfDay: 'any', tensionTier: 3, genre: 'mystery', cast: ['player'], reskinnable: true },
  { id: 'NO034', text: 'Chalk marks on the sidewalk might be kids\' games, or might be coordinates.', location: 'street', timeOfDay: 'afternoon', tensionTier: 2, genre: 'noir', cast: ['player'], reskinnable: true },
  { id: 'NO035', text: 'The ledger you found balances perfectly—too perfectly, every number divisible by seven.', location: 'workplace', timeOfDay: 'any', tensionTier: 3, genre: 'noir', cast: ['player'], reskinnable: true },
  { id: 'NO036', text: 'A lipstick mark on a coffee cup matches the shade of the woman asking questions downtown.', location: 'café', timeOfDay: 'afternoon', tensionTier: 2, genre: 'noir', cast: ['player'], reskinnable: true },
  { id: 'NO037', text: 'The files in the cabinet have been reorganized—someone was looking for something specific.', location: 'workplace', timeOfDay: 'morning', tensionTier: 3, genre: 'noir', cast: ['player'], reskinnable: true },
  { id: 'NO038', text: 'A cryptic message in the classifieds uses your birthday as the key, addressed to "Someone who knows."', location: 'café', timeOfDay: 'morning', tensionTier: 3, genre: 'mystery', cast: ['player'], reskinnable: true },
  { id: 'NO039', text: 'The bill from the hotel includes a room charge for a night you don\'t remember staying.', location: 'building', timeOfDay: 'any', tensionTier: 4, genre: 'noir', cast: ['player'], reskinnable: true },
  { id: 'NO040', text: 'A single bullet casing rolls out of your coat pocket, still smelling of gunpowder.', location: 'anywhere', timeOfDay: 'any', tensionTier: 4, genre: 'noir', cast: ['player'], reskinnable: true },
  
  // Moral Ambiguity
  { id: 'NO041', text: 'The money in the envelope is exactly what you need, with no note and no strings visible.', location: 'building', timeOfDay: 'any', tensionTier: 3, genre: 'noir', cast: ['player'], reskinnable: true },
  { id: 'NO042', text: 'The alibi you provided is being questioned, and the questions are coming from friends.', location: 'café', timeOfDay: 'afternoon', tensionTier: 4, genre: 'noir', cast: ['player', 'friend'], reskinnable: true },
  { id: 'NO043', text: 'A witness changes their story again, and this time it sounds like the truth.', location: 'building', timeOfDay: 'afternoon', tensionTier: 3, genre: 'noir', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'NO044', text: 'The judge\'s clerk winks as he hands you the sealed verdict, knowing something you don\'t.', location: 'building', timeOfDay: 'afternoon', tensionTier: 3, genre: 'noir', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'NO045', text: 'An old debt is being called in, the kind that can\'t be paid in money.', location: 'anywhere', timeOfDay: 'any', tensionTier: 4, genre: 'noir', cast: ['player', 'unknown'], reskinnable: true },
  { id: 'NO046', text: 'The deal on the table is dirty, but so is everyone else in the room.', location: 'building', timeOfDay: 'night', tensionTier: 4, genre: 'noir', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'NO047', text: 'Your reflection in the window looks guilty, even though you haven\'t done anything—yet.', location: 'building', timeOfDay: 'night', tensionTier: 3, genre: 'noir', cast: ['player'], reskinnable: true },
  { id: 'NO048', text: 'The confession letter burns in your pocket, written by someone else, signed with your name.', location: 'anywhere', timeOfDay: 'any', tensionTier: 5, genre: 'noir', cast: ['player'], reskinnable: true },
  { id: 'NO049', text: 'An anonymous tip saves you from a trap, and you\'re not sure if you should be grateful.', location: 'street', timeOfDay: 'night', tensionTier: 4, genre: 'noir', cast: ['player', 'unknown'], reskinnable: true },
  { id: 'NO050', text: 'The good cop and the bad cop turn out to be the same person, depending on who\'s watching.', location: 'building', timeOfDay: 'afternoon', tensionTier: 4, genre: 'noir', cast: ['player', 'authority'], reskinnable: true },
  
  // Consequences
  { id: 'NO051', text: 'The last person who sat in this chair never stood up again, according to the bartender.', location: 'café', timeOfDay: 'night', tensionTier: 3, genre: 'noir', cast: ['player', 'barista'], reskinnable: true },
  { id: 'NO052', text: 'A funeral procession passes, and one of the mourners looks directly at you, unblinking.', location: 'street', timeOfDay: 'afternoon', tensionTier: 3, genre: 'noir', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'NO053', text: 'The scar on your hand itches every time you pass this building, though you don\'t remember why.', location: 'street', timeOfDay: 'any', tensionTier: 3, genre: 'noir', cast: ['player'], reskinnable: true },
  { id: 'NO054', text: 'The headlines tomorrow will either clear your name or bury it—the editor owes you a favor.', location: 'anywhere', timeOfDay: 'night', tensionTier: 4, genre: 'noir', cast: ['player'], reskinnable: true },
  { id: 'NO055', text: 'A familiar face from prison passes by, now wearing a police uniform and pretending not to know you.', location: 'street', timeOfDay: 'afternoon', tensionTier: 4, genre: 'noir', cast: ['player', 'authority'], reskinnable: true },
  { id: 'NO056', text: 'The fire that erased the evidence also erased the only witness, conveniently.', location: 'street', timeOfDay: 'night', tensionTier: 4, genre: 'noir', cast: ['player'], reskinnable: true },
  { id: 'NO057', text: 'An old photograph shows you standing somewhere you swear you\'ve never been.', location: 'building', timeOfDay: 'any', tensionTier: 4, genre: 'noir', cast: ['player'], reskinnable: true },
  { id: 'NO058', text: 'The will names you as a beneficiary—of someone you were investigating.', location: 'building', timeOfDay: 'afternoon', tensionTier: 4, genre: 'noir', cast: ['player'], reskinnable: true },
  { id: 'NO059', text: 'A whisper at the party names the killer, but the voice comes from behind a mask you don\'t recognize.', location: 'building', timeOfDay: 'night', tensionTier: 4, genre: 'noir', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'NO060', text: 'The rain washes the blood from the sidewalk, but not from your memory.', location: 'street', timeOfDay: 'night', tensionTier: 4, genre: 'noir', cast: ['player'], contextHints: ['rain'], reskinnable: true },
];

// =============================================================================
// FANTASY EVENTS (60 events)
// =============================================================================

export const FANTASY_EVENTS: CatalogMicroEvent[] = [
  // Magic & Wonder
  { id: 'FA001', text: 'A phoenix feather drifts down from nowhere, still warm, glowing faintly orange at the edges.', location: 'street', timeOfDay: 'any', tensionTier: 2, genre: 'fantasy_lean', cast: ['player'], reskinnable: true },
  { id: 'FA002', text: 'The runes on the old wall glow briefly as you pass, then fade, like a greeting acknowledged.', location: 'building', timeOfDay: 'any', tensionTier: 2, genre: 'fantasy_lean', cast: ['player'], reskinnable: true },
  { id: 'FA003', text: 'A will-o\'-wisp hovers at the edge of the marsh, beckoning or warning—hard to tell which.', location: 'park', timeOfDay: 'dusk', tensionTier: 3, genre: 'fantasy_lean', cast: ['player'], reskinnable: true },
  { id: 'FA004', text: 'The merchant\'s scales tip on their own, adjusting for something invisible but apparently heavy.', location: 'market', timeOfDay: 'afternoon', tensionTier: 2, genre: 'fantasy_lean', cast: ['player', 'vendor'], reskinnable: true },
  { id: 'FA005', text: 'A crystal in the vendor\'s stall hums when you approach, falling silent for everyone else.', location: 'market', timeOfDay: 'afternoon', tensionTier: 2, genre: 'fantasy_lean', cast: ['player', 'vendor'], reskinnable: true },
  { id: 'FA006', text: 'The fountain statue blinks when no one is looking—you\'re almost sure of it.', location: 'plaza', timeOfDay: 'afternoon', tensionTier: 2, genre: 'fantasy_lean', cast: ['player'], reskinnable: true },
  { id: 'FA007', text: 'A rainbow appears in the waterfall mist, but the colors are wrong—silver, gold, violet.', location: 'park', timeOfDay: 'afternoon', tensionTier: 1, genre: 'fantasy_lean', cast: ['player'], reskinnable: true },
  { id: 'FA008', text: 'The old wizard\'s tower chimes at odd hours, and today it sounds like laughter.', location: 'building', timeOfDay: 'any', tensionTier: 2, genre: 'fantasy_lean', cast: ['player'], reskinnable: true },
  { id: 'FA009', text: 'A message bottle washes up at your feet, miles from any water, sealed with wax and moonlight.', location: 'park', timeOfDay: 'morning', tensionTier: 2, genre: 'fantasy_lean', cast: ['player'], reskinnable: true },
  { id: 'FA010', text: 'The candle flames in the tavern all lean toward you when you enter, then straighten innocently.', location: 'café', timeOfDay: 'evening', tensionTier: 2, genre: 'fantasy_lean', cast: ['player'], reskinnable: true },
  
  // Creatures & Beings
  { id: 'FA011', text: 'A dragon\'s shadow passes over the marketplace, but when you look up, the sky is empty.', location: 'market', timeOfDay: 'afternoon', tensionTier: 3, genre: 'fantasy_lean', cast: ['player', 'animal'], reskinnable: true },
  { id: 'FA012', text: 'The cat in the alley has too many tails, and eyes that know things they shouldn\'t.', location: 'alley', timeOfDay: 'evening', tensionTier: 3, genre: 'fantasy_lean', cast: ['player', 'animal'], reskinnable: true },
  { id: 'FA013', text: 'An owl delivers a letter to the wrong person, apologizes in perfect Common, and flies off.', location: 'street', timeOfDay: 'evening', tensionTier: 1, genre: 'comedy', cast: ['player', 'animal'], reskinnable: true },
  { id: 'FA014', text: 'The garden gnome turns to watch you pass, or perhaps you imagined its head moving.', location: 'neighborhood', timeOfDay: 'any', tensionTier: 2, genre: 'fantasy_lean', cast: ['player'], reskinnable: true },
  { id: 'FA015', text: 'A sprite tangled in a spider web demands rescue in a voice like angry bells.', location: 'park', timeOfDay: 'morning', tensionTier: 2, genre: 'fantasy_lean', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'FA016', text: 'The unicorn at the forest edge watches you for a long moment, then turns away in disappointment.', location: 'park', timeOfDay: 'morning', tensionTier: 2, genre: 'fantasy_lean', cast: ['player', 'animal'], reskinnable: true },
  { id: 'FA017', text: 'A goblin merchant offers "genuine hero relics," winking at the word "genuine" far too many times.', location: 'market', timeOfDay: 'afternoon', tensionTier: 1, genre: 'comedy', cast: ['player', 'vendor'], reskinnable: true },
  { id: 'FA018', text: 'The ghost in the cemetery waves politely, then goes back to tending a grave that reads "My Own."', location: 'park', timeOfDay: 'dusk', tensionTier: 2, genre: 'supernatural_lean', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'FA019', text: 'A centaur debates philosophy with a wizard at the crossroads, blocking all traffic in both directions.', location: 'intersection', timeOfDay: 'afternoon', tensionTier: 1, genre: 'comedy', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'FA020', text: 'The mermaid in the fountain pool stares at you with ancient eyes, then slips beneath the surface.', location: 'plaza', timeOfDay: 'evening', tensionTier: 3, genre: 'fantasy_lean', cast: ['player', 'stranger'], reskinnable: true },
  
  // Quests & Portents
  { id: 'FA021', text: 'A cloaked stranger presses a map into your hands, whispers "You\'ll need this," and vanishes.', location: 'street', timeOfDay: 'any', tensionTier: 3, genre: 'adventure', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'FA022', text: 'The old prophecy carved above the gate has a new line today, freshly chiseled.', location: 'building', timeOfDay: 'any', tensionTier: 4, genre: 'fantasy_lean', cast: ['player'], reskinnable: true },
  { id: 'FA023', text: 'A bounty notice on the board offers gold for someone matching your description exactly.', location: 'building', timeOfDay: 'any', tensionTier: 4, genre: 'adventure', cast: ['player'], reskinnable: true },
  { id: 'FA024', text: 'The stars last night formed a constellation that hasn\'t been seen in three hundred years.', location: 'anywhere', timeOfDay: 'morning', tensionTier: 3, genre: 'fantasy_lean', cast: ['player'], reskinnable: true },
  { id: 'FA025', text: 'A dying soldier presses a locket into your hand, gasping a name you don\'t recognize.', location: 'street', timeOfDay: 'any', tensionTier: 4, genre: 'drama', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'FA026', text: 'The oracle at the corner table looks up sharply as you enter, drops her cards, and leaves.', location: 'café', timeOfDay: 'any', tensionTier: 3, genre: 'fantasy_lean', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'FA027', text: 'A sword embedded in stone hums as you pass, like it\'s calling out to someone.', location: 'plaza', timeOfDay: 'any', tensionTier: 3, genre: 'fantasy_lean', cast: ['player'], reskinnable: true },
  { id: 'FA028', text: 'The king\'s herald reads a proclamation that sounds like a warning, specifically for you.', location: 'plaza', timeOfDay: 'afternoon', tensionTier: 4, genre: 'adventure', cast: ['player', 'authority'], reskinnable: true },
  { id: 'FA029', text: 'An ancient tree speaks a single word as you shelter beneath it, then falls silent for another century.', location: 'park', timeOfDay: 'any', tensionTier: 3, genre: 'fantasy_lean', cast: ['player'], reskinnable: true },
  { id: 'FA030', text: 'A child picks you out of the crowd and asks if you\'re "the one," then runs off before explaining.', location: 'market', timeOfDay: 'afternoon', tensionTier: 3, genre: 'mystery', cast: ['player', 'child'], reskinnable: true },
  
  // Daily Magic
  { id: 'FA031', text: 'The baker\'s bread rises on its own, loaves floating just above the counter while she reads.', location: 'shop', timeOfDay: 'morning', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'vendor'], reskinnable: true },
  { id: 'FA032', text: 'A mage student practices levitation on a bench, books orbiting their head in wobbly circles.', location: 'park', timeOfDay: 'afternoon', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'FA033', text: 'The weather witch announces tomorrow\'s forecast by reading cloud shapes, usually accurate.', location: 'plaza', timeOfDay: 'morning', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'FA034', text: 'An alchemist\'s shop explodes gently, releasing butterflies and the scent of strawberries.', location: 'street', timeOfDay: 'afternoon', tensionTier: 1, genre: 'comedy', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'FA035', text: 'The blacksmith hammers a blade that glows with each strike, mundane work with extraordinary results.', location: 'shop', timeOfDay: 'afternoon', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'FA036', text: 'A child chases a ball of living fire through the market, laughing, while vendors barely notice.', location: 'market', timeOfDay: 'afternoon', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'child'], reskinnable: true },
  { id: 'FA037', text: 'The town clock is wound by a golem each morning, its mechanical routine centuries old.', location: 'plaza', timeOfDay: 'morning', tensionTier: 1, genre: 'slice_of_life', cast: ['player'], reskinnable: true },
  { id: 'FA038', text: 'The healer\'s herbs sort themselves on the shelves, leaves rustling in friendly greeting.', location: 'shop', timeOfDay: 'any', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'vendor'], reskinnable: true },
  { id: 'FA039', text: 'A bard\'s song makes the tavern fire dance in shapes—forests, battles, a single rose blooming.', location: 'café', timeOfDay: 'evening', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'busker'], reskinnable: true },
  { id: 'FA040', text: 'The cobblestones rearrange themselves overnight, the town slowly shifting its layout by inches.', location: 'street', timeOfDay: 'morning', tensionTier: 2, genre: 'surreal', cast: ['player'], reskinnable: true },
  
  // Mysteries & Curses
  { id: 'FA041', text: 'The well in the center of town glows at midnight, and those who drink after dark dream of drowning.', location: 'plaza', timeOfDay: 'late_night', tensionTier: 4, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'FA042', text: 'A mirror in the antique shop shows a reflection of the room from a hundred years ago.', location: 'shop', timeOfDay: 'afternoon', tensionTier: 3, genre: 'supernatural_lean', cast: ['player'], reskinnable: true },
  { id: 'FA043', text: 'The cursed ring in the jeweler\'s case whispers promises of power to anyone who stops to look.', location: 'shop', timeOfDay: 'any', tensionTier: 3, genre: 'fantasy_lean', cast: ['player'], reskinnable: true },
  { id: 'FA044', text: 'A staircase in the library leads to a floor that doesn\'t exist—but people return from it changed.', location: 'building', timeOfDay: 'any', tensionTier: 4, genre: 'supernatural_lean', cast: ['player'], reskinnable: true },
  { id: 'FA045', text: 'The fortune teller packs up when she sees your palm, refusing payment, refusing explanation.', location: 'market', timeOfDay: 'afternoon', tensionTier: 4, genre: 'mystery', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'FA046', text: 'A locked chest in the basement rattles each night, and each morning the lock is scratched from inside.', location: 'building', timeOfDay: 'night', tensionTier: 4, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'FA047', text: 'The grimoire in the restricted section falls open to the same page whenever you walk past.', location: 'building', timeOfDay: 'any', tensionTier: 3, genre: 'fantasy_lean', cast: ['player'], reskinnable: true },
  { id: 'FA048', text: 'A shadow walks through town at noon, cast by nothing, stopping at doors and moving on.', location: 'street', timeOfDay: 'afternoon', tensionTier: 4, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  { id: 'FA049', text: 'The wishing well returns coins to their owners, and no one remembers making those wishes.', location: 'plaza', timeOfDay: 'any', tensionTier: 3, genre: 'mystery', cast: ['player'], reskinnable: true },
  { id: 'FA050', text: 'A door appears in the city wall overnight, and the first person to enter it hasn\'t returned.', location: 'street', timeOfDay: 'morning', tensionTier: 4, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  
  // Community & Culture
  { id: 'FA051', text: 'The harvest festival preparation includes hanging charms that actually work, keeping vermin away.', location: 'plaza', timeOfDay: 'afternoon', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'FA052', text: 'Guild apprentices race through the streets, their half-finished spells leaving trails of sparks.', location: 'street', timeOfDay: 'afternoon', tensionTier: 1, genre: 'comedy', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'FA053', text: 'The town council meeting includes a dwarf, an elf, and a talking cat, all equally opinionated.', location: 'building', timeOfDay: 'afternoon', tensionTier: 1, genre: 'comedy', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'FA054', text: 'A dragon in human form drinks tea at the café, its disguise impeccable except for smoke with every exhale.', location: 'café', timeOfDay: 'afternoon', tensionTier: 2, genre: 'fantasy_lean', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'FA055', text: 'Wedding bells ring for a union between houses, and the flowers in attendance bloom synchronized.', location: 'building', timeOfDay: 'afternoon', tensionTier: 1, genre: 'romance', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'FA056', text: 'The memorial garden holds statues of heroes who blink when no one watches, keeping vigil still.', location: 'park', timeOfDay: 'any', tensionTier: 2, genre: 'fantasy_lean', cast: ['player'], reskinnable: true },
  { id: 'FA057', text: 'A wandering troupe performs illusions indistinguishable from reality, their hat always suspiciously empty.', location: 'plaza', timeOfDay: 'evening', tensionTier: 2, genre: 'mystery', cast: ['player', 'busker'], reskinnable: true },
  { id: 'FA058', text: 'The archive keeper is ageless, remembering events from before the kingdom existed, cataloguing still.', location: 'building', timeOfDay: 'any', tensionTier: 2, genre: 'fantasy_lean', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'FA059', text: 'The night market sells dreams in bottles, labeled by intensity and color, buyer beware.', location: 'market', timeOfDay: 'night', tensionTier: 2, genre: 'fantasy_lean', cast: ['player', 'vendor'], reskinnable: true },
  { id: 'FA060', text: 'The lighthouse keeper on the cliff signals to ships that haven\'t sailed these waters in centuries.', location: 'building', timeOfDay: 'night', tensionTier: 2, genre: 'supernatural_lean', cast: ['player', 'stranger'], reskinnable: true },
];

// =============================================================================
// SCI-FI EVENTS (60 events)
// =============================================================================

export const SCIFI_EVENTS: CatalogMicroEvent[] = [
  // Technology
  { id: 'SF001', text: 'The holographic billboard glitches, showing a face that stares directly at you before correcting.', location: 'street', timeOfDay: 'evening', tensionTier: 3, genre: 'sci_fi_lean', cast: ['player'], reskinnable: true },
  { id: 'SF002', text: 'A drone swarm passes overhead, moving in patterns too complex to be random, too precise to be coincidence.', location: 'street', timeOfDay: 'afternoon', tensionTier: 2, genre: 'sci_fi_lean', cast: ['player'], reskinnable: true },
  { id: 'SF003', text: 'The vending machine suggests products based on biometrics, including "something for that headache coming."', location: 'building', timeOfDay: 'any', tensionTier: 2, genre: 'sci_fi_lean', cast: ['player'], reskinnable: true },
  { id: 'SF004', text: 'A maintenance robot stops cleaning to watch you pass, red eye tracking, then resumes without explanation.', location: 'hallway', timeOfDay: 'any', tensionTier: 3, genre: 'suspense', cast: ['player'], reskinnable: true },
  { id: 'SF005', text: 'The neural interface ad promises memories of vacations you\'ve never taken, guaranteed authentic.', location: 'street', timeOfDay: 'any', tensionTier: 2, genre: 'sci_fi_lean', cast: ['player'], reskinnable: true },
  { id: 'SF006', text: 'A delivery pod crash-lands in the plaza, contents marked "CLASSIFIED" and addressed to someone dead.', location: 'plaza', timeOfDay: 'afternoon', tensionTier: 3, genre: 'mystery', cast: ['player'], reskinnable: true },
  { id: 'SF007', text: 'The public terminal offers a software update that\'s three years old, from a company that no longer exists.', location: 'building', timeOfDay: 'any', tensionTier: 2, genre: 'mystery', cast: ['player'], reskinnable: true },
  { id: 'SF008', text: 'A child\'s toy robot recites poetry in a language no one has spoken for a thousand years.', location: 'park', timeOfDay: 'afternoon', tensionTier: 3, genre: 'surreal', cast: ['player', 'child'], reskinnable: true },
  { id: 'SF009', text: 'The elevator plays personalized ads, but today\'s ad mentions a secret you\'ve never told anyone.', location: 'building', timeOfDay: 'any', tensionTier: 4, genre: 'thriller', cast: ['player'], reskinnable: true },
  { id: 'SF010', text: 'A vintage screen displays static that forms faces if you stare long enough—faces that stare back.', location: 'building', timeOfDay: 'any', tensionTier: 3, genre: 'horror_lite', cast: ['player'], reskinnable: true },
  
  // Space & Stations
  { id: 'SF011', text: 'Through the viewport, a ship jumps to hyperspace, leaving a rainbow smear across the stars.', location: 'building', timeOfDay: 'any', tensionTier: 1, genre: 'sci_fi_lean', cast: ['player'], reskinnable: true },
  { id: 'SF012', text: 'The station groans as it rotates, metal settling in ways that sound almost like words.', location: 'building', timeOfDay: 'any', tensionTier: 2, genre: 'sci_fi_lean', cast: ['player'], reskinnable: true },
  { id: 'SF013', text: 'A meteor shower sparkles outside the observation deck, tourists gasping in unison.', location: 'building', timeOfDay: 'any', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'SF014', text: 'The artificial gravity hiccups, and for one weightless second, everyone floats an inch off the ground.', location: 'building', timeOfDay: 'any', tensionTier: 2, genre: 'sci_fi_lean', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'SF015', text: 'A quarantine alert flashes red on the next sector, then is just as quickly retracted without comment.', location: 'building', timeOfDay: 'any', tensionTier: 4, genre: 'suspense', cast: ['player'], reskinnable: true },
  { id: 'SF016', text: 'The airlock opens briefly, venting atmosphere before slamming shut—a maintenance error, they say.', location: 'building', timeOfDay: 'any', tensionTier: 4, genre: 'thriller', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'SF017', text: 'Someone has etched their name into the viewport glass, a view that won\'t survive the next polish.', location: 'building', timeOfDay: 'any', tensionTier: 1, genre: 'slice_of_life', cast: ['player'], reskinnable: true },
  { id: 'SF018', text: 'The captain\'s voice crackles through the intercom, asking for calm, which accomplishes the opposite.', location: 'building', timeOfDay: 'any', tensionTier: 3, genre: 'suspense', cast: ['player', 'authority'], reskinnable: true },
  { id: 'SF019', text: 'A child presses their face to the viewport, watching their home planet shrink to a dot.', location: 'building', timeOfDay: 'any', tensionTier: 1, genre: 'drama', cast: ['player', 'child'], reskinnable: true },
  { id: 'SF020', text: 'The hydroponics bay smells like Earth—or what someone remembers Earth smelling like.', location: 'building', timeOfDay: 'any', tensionTier: 1, genre: 'slice_of_life', cast: ['player'], reskinnable: true },
  
  // Cyberpunk Elements
  { id: 'SF021', text: 'A street surgeon offers chrome upgrades from a van, credentials displayed in holographic blue.', location: 'alley', timeOfDay: 'night', tensionTier: 3, genre: 'sci_fi_lean', cast: ['player', 'vendor'], reskinnable: true },
  { id: 'SF022', text: 'The AR overlay shows restaurant ratings, crime statistics, and one building labeled "DON\'T."', location: 'street', timeOfDay: 'any', tensionTier: 3, genre: 'mystery', cast: ['player'], reskinnable: true },
  { id: 'SF023', text: 'A hacker\'s drone drops a data chip at your feet, encoded with either salvation or a virus.', location: 'street', timeOfDay: 'evening', tensionTier: 4, genre: 'thriller', cast: ['player', 'unknown'], reskinnable: true },
  { id: 'SF024', text: 'The megacorp building casts a shadow that somehow falls on multiple sides of the street at once.', location: 'street', timeOfDay: 'afternoon', tensionTier: 2, genre: 'surreal', cast: ['player'], reskinnable: true },
  { id: 'SF025', text: 'A synth musician plays on the corner, their music generated by algorithms that sound like grief.', location: 'street', timeOfDay: 'evening', tensionTier: 2, genre: 'drama', cast: ['player', 'busker'], reskinnable: true },
  { id: 'SF026', text: 'The club\'s neural interface promises "shared consciousness," entrance fee payable in memories.', location: 'building', timeOfDay: 'night', tensionTier: 3, genre: 'sci_fi_lean', cast: ['player'], reskinnable: true },
  { id: 'SF027', text: 'A corporate security team sweeps the block, scanning everyone, finding nothing, moving on dissatisfied.', location: 'street', timeOfDay: 'any', tensionTier: 3, genre: 'thriller', cast: ['player', 'authority'], reskinnable: true },
  { id: 'SF028', text: 'The black market stall sells banned AI cores, each one whispering offers from inside their cases.', location: 'market', timeOfDay: 'night', tensionTier: 3, genre: 'sci_fi_lean', cast: ['player', 'vendor'], reskinnable: true },
  { id: 'SF029', text: 'A flickering neon sign reads "WE KNOW WHAT YOU DID" before returning to its normal advertisement.', location: 'street', timeOfDay: 'night', tensionTier: 4, genre: 'thriller', cast: ['player'], reskinnable: true },
  { id: 'SF030', text: 'The bartender\'s chrome arm polishes glasses in patterns that might be morse code, might be nothing.', location: 'café', timeOfDay: 'night', tensionTier: 2, genre: 'mystery', cast: ['player', 'barista'], reskinnable: true },
  
  // Aliens & First Contact
  { id: 'SF031', text: 'An alien tourist photographs everything, their translation device rendering laughter as static.', location: 'plaza', timeOfDay: 'afternoon', tensionTier: 1, genre: 'comedy', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'SF032', text: 'The diplomatic envoy passes in silence, their body language meaning something no one can interpret.', location: 'street', timeOfDay: 'any', tensionTier: 2, genre: 'sci_fi_lean', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'SF033', text: 'A xenobiologist argues with their research subject, who apparently has opinions about methodology.', location: 'building', timeOfDay: 'afternoon', tensionTier: 1, genre: 'comedy', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'SF034', text: 'The translator glitches, rendering a simple greeting as either hello or a declaration of war.', location: 'market', timeOfDay: 'any', tensionTier: 3, genre: 'comedy', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'SF035', text: 'An alien child plays a game that bends light, creating prisms that shouldn\'t be geometrically possible.', location: 'park', timeOfDay: 'afternoon', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'child'], reskinnable: true },
  { id: 'SF036', text: 'The new species at the café orders coffee, pronounces it delicious, and their skin briefly turns blue.', location: 'café', timeOfDay: 'morning', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'SF037', text: 'A telepathic species apologizes for accidentally broadcasting their surprise at your thoughts.', location: 'street', timeOfDay: 'any', tensionTier: 2, genre: 'comedy', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'SF038', text: 'The embassy\'s gardens grow plants from a dozen worlds, tended by beings who don\'t breathe oxygen.', location: 'building', timeOfDay: 'any', tensionTier: 1, genre: 'slice_of_life', cast: ['player'], reskinnable: true },
  { id: 'SF039', text: 'A message in a language no human speaks appears on the public boards, officially unacknowledged.', location: 'plaza', timeOfDay: 'any', tensionTier: 3, genre: 'mystery', cast: ['player'], reskinnable: true },
  { id: 'SF040', text: 'The newcomers celebrate their first rain, dancing in it, not understanding why others run for cover.', location: 'street', timeOfDay: 'afternoon', tensionTier: 1, genre: 'wholesome', cast: ['player', 'bystanders'], contextHints: ['rain'], reskinnable: true },
  
  // Dystopian Elements
  { id: 'SF041', text: 'The surveillance drone hovers just outside legal distance, lens focused on your coffee order.', location: 'café', timeOfDay: 'any', tensionTier: 3, genre: 'thriller', cast: ['player'], reskinnable: true },
  { id: 'SF042', text: 'A citizen\'s social score ticks up visibly on their badge, and strangers suddenly treat them better.', location: 'street', timeOfDay: 'any', tensionTier: 2, genre: 'drama', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'SF043', text: 'The curfew announcement plays on schedule, though the sun is still high and citizens ignore it.', location: 'street', timeOfDay: 'afternoon', tensionTier: 2, genre: 'thriller', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'SF044', text: 'A dissenter\'s graffiti is scrubbed away by drones before the paint dries, the wall pristine by morning.', location: 'street', timeOfDay: 'night', tensionTier: 3, genre: 'drama', cast: ['player'], reskinnable: true },
  { id: 'SF045', text: 'The ration line moves efficiently, but the portions seem smaller than the hologram promised.', location: 'building', timeOfDay: 'morning', tensionTier: 2, genre: 'drama', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'SF046', text: 'A propaganda screen plays the same loop for hours, and no one seems to notice anymore.', location: 'plaza', timeOfDay: 'any', tensionTier: 2, genre: 'thriller', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'SF047', text: 'The enforcement officer smiles, but the smile doesn\'t reach their eyes or their voice.', location: 'street', timeOfDay: 'any', tensionTier: 3, genre: 'thriller', cast: ['player', 'authority'], reskinnable: true },
  { id: 'SF048', text: 'A reward is offered for information, no details given, amount suspiciously high.', location: 'building', timeOfDay: 'any', tensionTier: 4, genre: 'thriller', cast: ['player'], reskinnable: true },
  { id: 'SF049', text: 'The underground news flickers briefly on a hijacked screen before the feed is cut.', location: 'plaza', timeOfDay: 'evening', tensionTier: 4, genre: 'thriller', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'SF050', text: 'Someone whispers the password to an illegal gathering, then walks away without looking back.', location: 'transit', timeOfDay: 'evening', tensionTier: 4, genre: 'thriller', cast: ['player', 'stranger'], reskinnable: true },
  
  // Hope & Progress
  { id: 'SF051', text: 'A child learns about trees in VR, and their wonder at something they\'ve never touched is heartbreaking.', location: 'building', timeOfDay: 'afternoon', tensionTier: 2, genre: 'drama', cast: ['player', 'child'], reskinnable: true },
  { id: 'SF052', text: 'The terraforming progress report shows green where there was brown, hope measured in percentages.', location: 'building', timeOfDay: 'any', tensionTier: 1, genre: 'slice_of_life', cast: ['player'], reskinnable: true },
  { id: 'SF053', text: 'A message from the colony ship arrives, generations old, filled with greetings from ancestors long dead.', location: 'building', timeOfDay: 'any', tensionTier: 2, genre: 'drama', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'SF054', text: 'The medical AI announces another disease cured, and the applause in the plaza is spontaneous and real.', location: 'plaza', timeOfDay: 'afternoon', tensionTier: 1, genre: 'wholesome', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'SF055', text: 'A veteran and their android companion share a bench in silence, both understanding what the other lost.', location: 'park', timeOfDay: 'evening', tensionTier: 2, genre: 'drama', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'SF056', text: 'The first natural rain in years falls on the dome, and everyone stops to watch the water run down.', location: 'plaza', timeOfDay: 'afternoon', tensionTier: 1, genre: 'wholesome', cast: ['player', 'bystanders'], contextHints: ['rain'], reskinnable: true },
  { id: 'SF057', text: 'A robot street sweeper stops to let a duckling family pass, programmed kindness in action.', location: 'street', timeOfDay: 'morning', tensionTier: 1, genre: 'wholesome', cast: ['player', 'animal'], reskinnable: true },
  { id: 'SF058', text: 'The university opens its doors to all species this year, and the orientation is gloriously chaotic.', location: 'building', timeOfDay: 'morning', tensionTier: 1, genre: 'comedy', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'SF059', text: 'An elderly couple takes their first virtual vacation to a home planet that no longer exists.', location: 'building', timeOfDay: 'evening', tensionTier: 2, genre: 'drama', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'SF060', text: 'The stars through the viewport spell out a constellation from home, and someone starts to cry softly.', location: 'building', timeOfDay: 'night', tensionTier: 2, genre: 'drama', cast: ['player', 'bystanders'], reskinnable: true },
];

// =============================================================================
// WESTERN EVENTS (50 events)
// =============================================================================

export const WESTERN_EVENTS: CatalogMicroEvent[] = [
  // Town Life
  { id: 'WE001', text: 'The saloon doors swing open and everyone\'s eyes find you, conversations dying mid-word.', location: 'café', timeOfDay: 'any', tensionTier: 3, genre: 'suspense', cast: ['player', 'patrons'], reskinnable: true },
  { id: 'WE002', text: 'Dust swirls down Main Street as a tumbleweed bounces past, bound for somewhere with fewer questions.', location: 'street', timeOfDay: 'afternoon', tensionTier: 1, genre: 'universal', cast: ['player'], reskinnable: true },
  { id: 'WE003', text: 'The general store owner weighs your gold twice, as if hoping the second measure will be different.', location: 'shop', timeOfDay: 'afternoon', tensionTier: 2, genre: 'suspense', cast: ['player', 'vendor'], reskinnable: true },
  { id: 'WE004', text: 'A horse stamps impatiently at the hitching post, eyeing you like it knows something you don\'t.', location: 'street', timeOfDay: 'any', tensionTier: 1, genre: 'universal', cast: ['player', 'animal'], reskinnable: true },
  { id: 'WE005', text: 'The blacksmith\'s hammer rings out in steady rhythm, sparks flying like orange fireflies.', location: 'shop', timeOfDay: 'afternoon', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'WE006', text: 'Children chase a hoop down the dusty street, laughing until they see the badge on your chest.', location: 'street', timeOfDay: 'afternoon', tensionTier: 2, genre: 'drama', cast: ['player', 'child'], reskinnable: true },
  { id: 'WE007', text: 'The preacher quotes scripture from the steps of the church, but his eyes are fixed on the bank.', location: 'plaza', timeOfDay: 'morning', tensionTier: 2, genre: 'mystery', cast: ['player', 'preacher'], reskinnable: true },
  { id: 'WE008', text: 'A wanted poster peels off the board, your face looking up from the dirt—or someone who looks close enough.', location: 'building', timeOfDay: 'any', tensionTier: 4, genre: 'thriller', cast: ['player'], reskinnable: true },
  { id: 'WE009', text: 'The telegraph operator taps out a message, glancing at you with each pause in the clicking.', location: 'building', timeOfDay: 'afternoon', tensionTier: 3, genre: 'suspense', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'WE010', text: 'A widow in black watches from her window, curtain drawn back just enough to see, never enough to be seen.', location: 'neighborhood', timeOfDay: 'afternoon', tensionTier: 2, genre: 'mystery', cast: ['player', 'stranger'], reskinnable: true },
  
  // Open Range
  { id: 'WE011', text: 'Cattle low in the distance, a sound as old as the land, as patient as the prairie.', location: 'anywhere', timeOfDay: 'evening', tensionTier: 1, genre: 'universal', cast: ['player', 'animal'], reskinnable: true },
  { id: 'WE012', text: 'A coyote watches from a ridge, neither hunting nor fleeing, just observing with ancient eyes.', location: 'anywhere', timeOfDay: 'dusk', tensionTier: 2, genre: 'universal', cast: ['player', 'animal'], reskinnable: true },
  { id: 'WE013', text: 'Vultures circle something dead beyond the next hill, nature\'s dark punctuation on the landscape.', location: 'anywhere', timeOfDay: 'afternoon', tensionTier: 3, genre: 'suspense', cast: ['player', 'animal'], reskinnable: true },
  { id: 'WE014', text: 'The sunset paints the mesa in shades of blood and gold, beautiful and ominous in equal measure.', location: 'anywhere', timeOfDay: 'evening', tensionTier: 1, genre: 'universal', cast: ['player'], reskinnable: true },
  { id: 'WE015', text: 'A lone rider appears on the horizon, heading your direction, hand resting on their holster.', location: 'anywhere', timeOfDay: 'afternoon', tensionTier: 4, genre: 'thriller', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'WE016', text: 'The watering hole is crowded, an uneasy truce between ranchers who\'d rather not share.', location: 'anywhere', timeOfDay: 'afternoon', tensionTier: 3, genre: 'drama', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'WE017', text: 'A rattlesnake coils in the shade of a rock, warning you with a sound older than memory.', location: 'anywhere', timeOfDay: 'afternoon', tensionTier: 3, genre: 'universal', cast: ['player', 'animal'], reskinnable: true },
  { id: 'WE018', text: 'Smoke rises from a distant campfire, and out here that could mean friends or trouble.', location: 'anywhere', timeOfDay: 'evening', tensionTier: 3, genre: 'suspense', cast: ['player'], reskinnable: true },
  { id: 'WE019', text: 'An abandoned wagon sits by the trail, goods scattered, no sign of who left it or why.', location: 'street', timeOfDay: 'any', tensionTier: 3, genre: 'mystery', cast: ['player'], reskinnable: true },
  { id: 'WE020', text: 'The night sky stretches endless, stars so thick you could scoop them with your hat.', location: 'anywhere', timeOfDay: 'night', tensionTier: 1, genre: 'wholesome', cast: ['player'], reskinnable: true },
  
  // Conflict & Tension
  { id: 'WE021', text: 'Two men face each other across the street, hands hovering, time itself holding its breath.', location: 'street', timeOfDay: 'afternoon', tensionTier: 5, genre: 'thriller', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'WE022', text: 'The sheriff spits tobacco juice and measures you with eyes that have seen too much to trust easily.', location: 'street', timeOfDay: 'afternoon', tensionTier: 3, genre: 'suspense', cast: ['player', 'authority'], reskinnable: true },
  { id: 'WE023', text: 'A gunshot echoes from the hills, could be a hunter, could be a warning, could be a start.', location: 'anywhere', timeOfDay: 'any', tensionTier: 4, genre: 'thriller', cast: ['player'], reskinnable: true },
  { id: 'WE024', text: 'The banker locks the vault early today, claiming repair work, but his hands are shaking.', location: 'building', timeOfDay: 'afternoon', tensionTier: 3, genre: 'mystery', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'WE025', text: 'A posse forms at the edge of town, too many rifles for a simple cattle thief.', location: 'street', timeOfDay: 'morning', tensionTier: 4, genre: 'thriller', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'WE026', text: 'The undertaker measures you with his eyes, professional curiosity or something more sinister.', location: 'storefront', timeOfDay: 'any', tensionTier: 2, genre: 'comedy', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'WE027', text: 'A card game pauses as you enter, chips frozen mid-bet, everyone\'s hand suddenly too close to their hip.', location: 'café', timeOfDay: 'evening', tensionTier: 4, genre: 'thriller', cast: ['player', 'patrons'], reskinnable: true },
  { id: 'WE028', text: 'The stagecoach arrives with a bullet hole in its door and a driver who won\'t meet anyone\'s eyes.', location: 'street', timeOfDay: 'afternoon', tensionTier: 4, genre: 'mystery', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'WE029', text: 'Someone\'s been digging at the old claim again, and they\'re digging at night.', location: 'anywhere', timeOfDay: 'morning', tensionTier: 3, genre: 'mystery', cast: ['player'], reskinnable: true },
  { id: 'WE030', text: 'The gallows stand empty in the square, rope swaying in the wind, reminding everyone of consequences.', location: 'plaza', timeOfDay: 'any', tensionTier: 3, genre: 'drama', cast: ['player'], reskinnable: true },
  
  // Character Encounters
  { id: 'WE031', text: 'The barkeep pours without asking, the same drink he\'s poured every night for years.', location: 'café', timeOfDay: 'evening', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'barista'], reskinnable: true },
  { id: 'WE032', text: 'A gambler offers a friendly game, but his smile has too many teeth and not enough warmth.', location: 'café', timeOfDay: 'evening', tensionTier: 3, genre: 'suspense', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'WE033', text: 'The dance hall girl knows more secrets than the preacher, and keeps them better too.', location: 'building', timeOfDay: 'evening', tensionTier: 2, genre: 'drama', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'WE034', text: 'An old prospector claims to know where the gold is, for the price of a drink and a promise.', location: 'café', timeOfDay: 'any', tensionTier: 2, genre: 'adventure', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'WE035', text: 'The doctor washes blood from his hands, not meeting your eyes as he announces another death.', location: 'building', timeOfDay: 'any', tensionTier: 3, genre: 'drama', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'WE036', text: 'A rancher\'s daughter sneaks a glance at you from behind her father\'s stern shoulder.', location: 'street', timeOfDay: 'afternoon', tensionTier: 2, genre: 'romance', cast: ['player', 'stranger', 'guardian'], reskinnable: true },
  { id: 'WE037', text: 'The native scout says nothing, but his eyes speak volumes about what waits on the trail ahead.', location: 'anywhere', timeOfDay: 'any', tensionTier: 3, genre: 'suspense', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'WE038', text: 'A railroad man marks the land with stakes, not caring whose home he\'s planning to run through.', location: 'anywhere', timeOfDay: 'afternoon', tensionTier: 3, genre: 'drama', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'WE039', text: 'The missionary offers salvation, but her Bible is worn from use as something other than reading.', location: 'street', timeOfDay: 'any', tensionTier: 2, genre: 'mystery', cast: ['player', 'preacher'], reskinnable: true },
  { id: 'WE040', text: 'An orphan sits alone on the porch, old enough to work but young enough to still dream of rescue.', location: 'building', timeOfDay: 'afternoon', tensionTier: 2, genre: 'drama', cast: ['player', 'child'], reskinnable: true },
  
  // Moments of Grace
  { id: 'WE041', text: 'A harmonica plays softly from somewhere, a lonesome tune that carries the weight of miles.', location: 'anywhere', timeOfDay: 'evening', tensionTier: 1, genre: 'slice_of_life', cast: ['player'], reskinnable: true },
  { id: 'WE042', text: 'The church bell rings for Sunday service, and even the sinners stop to listen for a moment.', location: 'plaza', timeOfDay: 'morning', tensionTier: 1, genre: 'wholesome', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'WE043', text: 'A mother hangs laundry in the yard, singing softly, a patch of normalcy in an untamed land.', location: 'neighborhood', timeOfDay: 'morning', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'WE044', text: 'A foal takes its first wobbly steps, and hardened cowboys pause to watch the miracle.', location: 'anywhere', timeOfDay: 'morning', tensionTier: 1, genre: 'wholesome', cast: ['player', 'bystanders', 'animal'], reskinnable: true },
  { id: 'WE045', text: 'Rain comes to the drought-parched land, and faces turn skyward with something like prayer.', location: 'anywhere', timeOfDay: 'afternoon', tensionTier: 1, genre: 'wholesome', cast: ['player', 'bystanders'], contextHints: ['rain'], reskinnable: true },
  { id: 'WE046', text: 'A fiddler plays for dancers in the barn, couples spinning like there\'s no danger waiting outside.', location: 'building', timeOfDay: 'evening', tensionTier: 1, genre: 'wholesome', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'WE047', text: 'The old-timer tells stories of the land before the fence, and the children listen like it\'s legend.', location: 'café', timeOfDay: 'evening', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'stranger', 'child'], reskinnable: true },
  { id: 'WE048', text: 'A stranger tips their hat as they pass, the small courtesy meaning everything out here.', location: 'street', timeOfDay: 'any', tensionTier: 1, genre: 'slice_of_life', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'WE049', text: 'The cook rings the triangle for supper, and the smell of beans and bacon brings folks running.', location: 'anywhere', timeOfDay: 'evening', tensionTier: 1, genre: 'wholesome', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'WE050', text: 'A shooting star streaks across the desert sky, and an old cowboy makes a wish like a young boy would.', location: 'anywhere', timeOfDay: 'night', tensionTier: 1, genre: 'wholesome', cast: ['player', 'stranger'], reskinnable: true },
];

// =============================================================================
// ROMANTIC EVENTS (50 events)
// =============================================================================

export const ROMANTIC_EVENTS: CatalogMicroEvent[] = [
  // Meet-Cutes
  { id: 'RO001', text: 'Your books scatter everywhere when you collide, and they\'re reading the same obscure title.', location: 'building', timeOfDay: 'afternoon', tensionTier: 1, genre: 'romance', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'RO002', text: 'Rain starts suddenly, and you share a doorway with someone who hates the same popular song.', location: 'street', timeOfDay: 'afternoon', tensionTier: 1, genre: 'romance', cast: ['player', 'stranger'], contextHints: ['rain'], reskinnable: true },
  { id: 'RO003', text: 'Both of you reach for the last pastry in the case, and the barista watches like it\'s entertainment.', location: 'café', timeOfDay: 'morning', tensionTier: 1, genre: 'romance', cast: ['player', 'stranger', 'barista'], reskinnable: true },
  { id: 'RO004', text: 'A dog wraps its leash around both of you, and its owner laughs while not apologizing at all.', location: 'park', timeOfDay: 'afternoon', tensionTier: 1, genre: 'romance', cast: ['player', 'stranger', 'animal'], reskinnable: true },
  { id: 'RO005', text: 'The elevator stalls between floors, and the stranger introduces themselves as if planned.', location: 'building', timeOfDay: 'any', tensionTier: 2, genre: 'romance', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'RO006', text: 'A gust of wind steals your hat, and they catch it with a smile that catches something else too.', location: 'park', timeOfDay: 'afternoon', tensionTier: 1, genre: 'romance', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'RO007', text: 'Wrong number turns into right conversation, and three hours pass without either of you noticing.', location: 'anywhere', timeOfDay: 'evening', tensionTier: 1, genre: 'romance', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'RO008', text: 'The bookstore clerk recommends something embarrassing, and the stranger next to you laughs sympathetically.', location: 'shop', timeOfDay: 'afternoon', tensionTier: 1, genre: 'romance', cast: ['player', 'stranger', 'clerk'], reskinnable: true },
  { id: 'RO009', text: 'A flash mob separates you from your group, leaving you next to someone who shares your bewilderment.', location: 'plaza', timeOfDay: 'afternoon', tensionTier: 1, genre: 'romance', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'RO010', text: 'The coffee shop mixes up your orders, and you both realize you have identical terrible taste.', location: 'café', timeOfDay: 'morning', tensionTier: 1, genre: 'romance', cast: ['player', 'stranger'], reskinnable: true },
  
  // Stolen Glances
  { id: 'RO011', text: 'They look away just as you look up, but their smile lingers like an invitation.', location: 'café', timeOfDay: 'afternoon', tensionTier: 2, genre: 'romance', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'RO012', text: 'A shared glance across the crowded room lasts one second too long to be accidental.', location: 'building', timeOfDay: 'evening', tensionTier: 2, genre: 'romance', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'RO013', text: 'They wave at someone behind you, and you wave back before realizing, mortified and laughing.', location: 'street', timeOfDay: 'afternoon', tensionTier: 1, genre: 'comedy', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'RO014', text: 'The reflection in the window shows them watching you, and they\'re too slow to look away this time.', location: 'café', timeOfDay: 'afternoon', tensionTier: 2, genre: 'romance', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'RO015', text: 'A knowing smile passes between you—shared joke about the speaker neither of you agrees with.', location: 'building', timeOfDay: 'afternoon', tensionTier: 2, genre: 'romance', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'RO016', text: 'They hold the door just long enough for eye contact, just brief enough to want more.', location: 'building', timeOfDay: 'any', tensionTier: 1, genre: 'romance', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'RO017', text: 'Your hands brush reaching for the same handle, and neither of you pulls away immediately.', location: 'transit', timeOfDay: 'any', tensionTier: 2, genre: 'romance', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'RO018', text: 'They\'re reading a book you love, and you debate whether strangers recommend books on trains.', location: 'transit', timeOfDay: 'any', tensionTier: 1, genre: 'romance', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'RO019', text: 'A laugh from across the garden catches your attention—warm, genuine, impossible to ignore.', location: 'park', timeOfDay: 'afternoon', tensionTier: 1, genre: 'romance', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'RO020', text: 'The musician on the corner plays a song that makes you both stop, strangers sharing a moment.', location: 'street', timeOfDay: 'evening', tensionTier: 1, genre: 'romance', cast: ['player', 'stranger', 'busker'], reskinnable: true },
  
  // Tender Moments
  { id: 'RO021', text: 'They remember how you take your coffee, and the simple fact of it blooms warm in your chest.', location: 'café', timeOfDay: 'morning', tensionTier: 1, genre: 'romance', cast: ['player', 'friend'], reskinnable: true },
  { id: 'RO022', text: 'A hand reaches out to steady you before you even realize you\'re about to stumble.', location: 'street', timeOfDay: 'any', tensionTier: 1, genre: 'romance', cast: ['player', 'friend'], reskinnable: true },
  { id: 'RO023', text: 'The jacket settles around your shoulders before you finish saying you\'re cold.', location: 'park', timeOfDay: 'evening', tensionTier: 1, genre: 'romance', cast: ['player', 'friend'], reskinnable: true },
  { id: 'RO024', text: 'They save the last bite for you without asking, without making a production of it.', location: 'café', timeOfDay: 'evening', tensionTier: 1, genre: 'romance', cast: ['player', 'friend'], reskinnable: true },
  { id: 'RO025', text: 'Comfortable silence stretches between you, neither of you needing to fill it with words.', location: 'park', timeOfDay: 'evening', tensionTier: 1, genre: 'romance', cast: ['player', 'friend'], reskinnable: true },
  { id: 'RO026', text: 'A strand of hair is tucked behind your ear, and the gesture is so gentle it stops time.', location: 'anywhere', timeOfDay: 'evening', tensionTier: 2, genre: 'romance', cast: ['player', 'friend'], reskinnable: true },
  { id: 'RO027', text: 'They quote your favorite movie without prompting, and suddenly you understand what "seen" means.', location: 'café', timeOfDay: 'evening', tensionTier: 2, genre: 'romance', cast: ['player', 'friend'], reskinnable: true },
  { id: 'RO028', text: 'Your phone buzzes with a good morning message, and the whole day recalibrates around it.', location: 'home', timeOfDay: 'morning', tensionTier: 1, genre: 'romance', cast: ['player'], reskinnable: true },
  { id: 'RO029', text: 'Dancing without music in the kitchen, just because a song on the radio reminded them of you.', location: 'home', timeOfDay: 'evening', tensionTier: 1, genre: 'romance', cast: ['player', 'friend'], reskinnable: true },
  { id: 'RO030', text: 'A note left in your pocket says nothing important, everything important.', location: 'anywhere', timeOfDay: 'any', tensionTier: 1, genre: 'romance', cast: ['player'], reskinnable: true },
  
  // Longing & Distance
  { id: 'RO031', text: 'The empty chair across from you feels like a statement, and coffee tastes different alone.', location: 'café', timeOfDay: 'morning', tensionTier: 2, genre: 'drama', cast: ['player'], reskinnable: true },
  { id: 'RO032', text: 'A song plays that belonged to both of you, and the past tense of it aches.', location: 'anywhere', timeOfDay: 'any', tensionTier: 2, genre: 'drama', cast: ['player'], reskinnable: true },
  { id: 'RO033', text: 'Their perfume lingers on a scarf they left behind, and you haven\'t washed it on purpose.', location: 'home', timeOfDay: 'any', tensionTier: 2, genre: 'drama', cast: ['player'], reskinnable: true },
  { id: 'RO034', text: 'A message typed and deleted three times, sending nothing, saying everything.', location: 'anywhere', timeOfDay: 'any', tensionTier: 2, genre: 'drama', cast: ['player'], reskinnable: true },
  { id: 'RO035', text: 'Rain on the window sounds like the night you said goodbye, and the weather has no right.', location: 'home', timeOfDay: 'night', tensionTier: 2, genre: 'drama', cast: ['player'], contextHints: ['rain'], reskinnable: true },
  { id: 'RO036', text: 'The bench where you used to sit has a new couple now, young and unaware of its history.', location: 'park', timeOfDay: 'afternoon', tensionTier: 2, genre: 'drama', cast: ['player', 'bystanders'], reskinnable: true },
  { id: 'RO037', text: 'A photograph falls out of a book, faces smiling, a moment frozen before it all changed.', location: 'home', timeOfDay: 'any', tensionTier: 2, genre: 'drama', cast: ['player'], reskinnable: true },
  { id: 'RO038', text: 'They\'re in the same room but across the party, and the distance is measured in more than feet.', location: 'building', timeOfDay: 'evening', tensionTier: 3, genre: 'drama', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'RO039', text: 'An anniversary passes unmarked, remembered only by you, heavy with what didn\'t happen.', location: 'anywhere', timeOfDay: 'any', tensionTier: 2, genre: 'drama', cast: ['player'], reskinnable: true },
  { id: 'RO040', text: 'Their name still autocorrects on your phone, technology preserving what you can\'t delete.', location: 'anywhere', timeOfDay: 'any', tensionTier: 2, genre: 'drama', cast: ['player'], reskinnable: true },
  
  // Second Chances
  { id: 'RO041', text: 'Years later, same café, different lives, and they look up when the door chimes just like before.', location: 'café', timeOfDay: 'afternoon', tensionTier: 3, genre: 'romance', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'RO042', text: 'An apology arrives in the mail, handwritten, years overdue and yet perfectly on time.', location: 'home', timeOfDay: 'any', tensionTier: 3, genre: 'drama', cast: ['player'], reskinnable: true },
  { id: 'RO043', text: 'The number you\'d deleted sends a simple "thinking of you," and suddenly you are too.', location: 'anywhere', timeOfDay: 'evening', tensionTier: 3, genre: 'romance', cast: ['player'], reskinnable: true },
  { id: 'RO044', text: 'A mutual friend "accidentally" invites you both to the same small gathering.', location: 'building', timeOfDay: 'evening', tensionTier: 3, genre: 'romance', cast: ['player', 'friend', 'stranger'], reskinnable: true },
  { id: 'RO045', text: 'They\'ve changed, grown, and something in their smile suggests the past isn\'t the whole story.', location: 'café', timeOfDay: 'afternoon', tensionTier: 3, genre: 'romance', cast: ['player', 'stranger'], reskinnable: true },
  { id: 'RO046', text: 'A bookmark falls out of a borrowed book, covered in notes in familiar handwriting.', location: 'home', timeOfDay: 'any', tensionTier: 2, genre: 'romance', cast: ['player'], reskinnable: true },
  { id: 'RO047', text: 'The rain brings you under the same awning again, and this time you ask their name first.', location: 'street', timeOfDay: 'afternoon', tensionTier: 2, genre: 'romance', cast: ['player', 'stranger'], contextHints: ['rain'], reskinnable: true },
  { id: 'RO048', text: 'A conversation that ended in anger starts again in laughter, time having done its quiet work.', location: 'café', timeOfDay: 'evening', tensionTier: 2, genre: 'romance', cast: ['player', 'friend'], reskinnable: true },
  { id: 'RO049', text: 'The song that used to hurt plays, and you realize you\'re humming along without crying.', location: 'café', timeOfDay: 'any', tensionTier: 1, genre: 'drama', cast: ['player'], reskinnable: true },
  { id: 'RO050', text: 'They wait at the corner where you first met, holding the same nervous hope they held then.', location: 'intersection', timeOfDay: 'evening', tensionTier: 3, genre: 'romance', cast: ['player', 'stranger'], reskinnable: true },
];

// =============================================================================
// COMBINE ALL EXPANSION EVENTS
// =============================================================================

export const ALL_EXPANSION_EVENTS: CatalogMicroEvent[] = [
  ...POST_APOCALYPTIC_EVENTS,
  ...MODERN_URBAN_EVENTS,
  ...HORROR_EVENTS,
  ...NOIR_EVENTS,
  ...FANTASY_EVENTS,
  ...SCIFI_EVENTS,
  ...WESTERN_EVENTS,
  ...ROMANTIC_EVENTS,
];

export const EXPANSION_EVENT_COUNT = ALL_EXPANSION_EVENTS.length;
