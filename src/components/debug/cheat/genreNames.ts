// Genre-specific name pools + name generation for the Creators Mark panel.
// Extracted verbatim from CheatModeSplash.tsx — no behavior changes.

// Genre-specific name pools by gender with expanded options
export const GENRE_NAMES: Record<string, { male: string[]; female: string[]; other: string[]; lastNames?: string[] }> = {
  fantasy: {
    male: [
      'Marcus', 'Aldric', 'Gareth', 'Theron', 'Roland', 'Cedric', 'Edmund', 'Gideon', 'Hadrian', 'Leander',
      'Alaric', 'Brennan', 'Caspian', 'Dorian', 'Evander', 'Fenris', 'Godric', 'Harlan', 'Idris', 'Jareth',
      'Kael', 'Lucian', 'Magnus', 'Nolan', 'Orin', 'Percival', 'Quentin', 'Riordan', 'Silas', 'Tristan',
      'Ulric', 'Varian', 'Wulfric', 'Xavier', 'Yorick', 'Zephyr', 'Aleron', 'Bastian', 'Caelum', 'Darian'
    ],
    female: [
      'Elena', 'Lyra', 'Seraphina', 'Celeste', 'Diana', 'Freya', 'Helena', 'Iris', 'Luna', 'Ophelia',
      'Aurelia', 'Brielle', 'Cordelia', 'Daphne', 'Elara', 'Fiona', 'Gwendolyn', 'Helene', 'Isolde', 'Jasmine',
      'Katarina', 'Liora', 'Mirabel', 'Nadia', 'Odessa', 'Persephone', 'Rowena', 'Sabine', 'Thalia', 'Ursula',
      'Valeria', 'Wren', 'Xanthe', 'Ysolde', 'Zelda', 'Ariadne', 'Brianna', 'Cassia', 'Dahlia', 'Elowen'
    ],
    other: ['Rowan', 'Sage', 'Ash', 'Morgan', 'Raven', 'Quinn', 'Wren', 'Phoenix', 'River', 'Storm', 'Ember', 'Onyx', 'Vale', 'Larkspur', 'Cypress'],
    lastNames: ['Stormwind', 'Ironforge', 'Brightblade', 'Shadowmere', 'Thornwood', 'Silverhand', 'Blackwood', 'Ravencrest', 'Goldleaf', 'Drakemoor', 'Starfall', 'Nighthollow', 'Frostborne', 'Ashford', 'Moonwhisper'],
  },
  modern: {
    male: [
      'James', 'Michael', 'David', 'Ryan', 'Alex', 'Chris', 'Daniel', 'Marcus', 'Jason', 'Kevin',
      'Andrew', 'Brian', 'Carlos', 'Derek', 'Eric', 'Frank', 'Greg', 'Henry', 'Ian', 'Jack',
      'Kyle', 'Lucas', 'Matt', 'Nathan', 'Oscar', 'Patrick', 'Robert', 'Steven', 'Tyler', 'Victor',
      'William', 'Zachary', 'Adrian', 'Brandon', 'Connor', 'Dylan', 'Ethan', 'Felix', 'Gabriel', 'Hugo'
    ],
    female: [
      'Sarah', 'Emily', 'Jessica', 'Amanda', 'Nicole', 'Rachel', 'Megan', 'Lauren', 'Natalie', 'Samantha',
      'Ashley', 'Brittany', 'Christina', 'Diana', 'Elena', 'Fiona', 'Grace', 'Hannah', 'Isabella', 'Julia',
      'Katherine', 'Lisa', 'Maria', 'Nancy', 'Olivia', 'Patricia', 'Rebecca', 'Sophia', 'Tiffany', 'Victoria',
      'Wendy', 'Zoe', 'Abigail', 'Brooke', 'Charlotte', 'Danielle', 'Emma', 'Faith', 'Gabriella', 'Heather'
    ],
    other: ['Jordan', 'Alex', 'Taylor', 'Casey', 'Riley', 'Morgan', 'Avery', 'Quinn', 'Jamie', 'Drew', 'Skyler', 'Cameron', 'Dakota', 'Reese', 'Kendall'],
    lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Young'],
  },
  modern_life: {
    male: [
      'James', 'Michael', 'David', 'Ryan', 'Alex', 'Chris', 'Daniel', 'Marcus', 'Jason', 'Kevin',
      'Andrew', 'Brian', 'Carlos', 'Derek', 'Eric', 'Frank', 'Greg', 'Henry', 'Ian', 'Jack',
      'Kyle', 'Lucas', 'Matt', 'Nathan', 'Oscar', 'Patrick', 'Robert', 'Steven', 'Tyler', 'Victor'
    ],
    female: [
      'Sarah', 'Emily', 'Jessica', 'Amanda', 'Nicole', 'Rachel', 'Megan', 'Lauren', 'Natalie', 'Samantha',
      'Ashley', 'Brittany', 'Christina', 'Diana', 'Elena', 'Fiona', 'Grace', 'Hannah', 'Isabella', 'Julia',
      'Katherine', 'Lisa', 'Maria', 'Nancy', 'Olivia', 'Patricia', 'Rebecca', 'Sophia', 'Tiffany', 'Victoria'
    ],
    other: ['Jordan', 'Alex', 'Taylor', 'Casey', 'Riley', 'Morgan', 'Avery', 'Quinn', 'Jamie', 'Drew', 'Skyler', 'Cameron', 'Dakota', 'Reese', 'Kendall'],
    lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Young'],
  },
  scifi: {
    male: [
      'Zane', 'Marcus', 'Rex', 'Cole', 'Jax', 'Kane', 'Dex', 'Orion', 'Atlas', 'Cyrus',
      'Axel', 'Blaze', 'Cade', 'Drake', 'Enzo', 'Flynn', 'Gage', 'Hunter', 'Ivan', 'Jett',
      'Kai', 'Leo', 'Milo', 'Neo', 'Odin', 'Pierce', 'Raven', 'Slade', 'Titan', 'Vance',
      'Wyatt', 'Xander', 'York', 'Zeke', 'Ares', 'Bishop', 'Colt', 'Dash', 'Ezra', 'Finn'
    ],
    female: [
      'Nova', 'Stella', 'Vera', 'Lyra', 'Zara', 'Kira', 'Mira', 'Astra', 'Cora', 'Vega',
      'Aurora', 'Celeste', 'Diana', 'Echo', 'Freya', 'Gemma', 'Hera', 'Iris', 'Jade', 'Kaia',
      'Luna', 'Maya', 'Nyx', 'Oriana', 'Phoebe', 'Quinn', 'Rhea', 'Selene', 'Terra', 'Uma',
      'Venus', 'Willa', 'Xena', 'Yara', 'Zena', 'Andromeda', 'Bellatrix', 'Cassiopeia', 'Dione', 'Europa'
    ],
    other: ['Seren', 'Kai', 'Sol', 'Phoenix', 'Onyx', 'Rune', 'Cipher', 'Nova', 'Echo', 'Argo', 'Nebula', 'Cosmos', 'Zenith', 'Axis', 'Prism'],
    lastNames: ['Vance', 'Sterling', 'Cross', 'Drake', 'Frost', 'Stone', 'Hawk', 'Wolf', 'Storm', 'Blaze', 'Steele', 'Nova', 'Cosmos', 'Zenith', 'Vector'],
  },
  cyberpunk: {
    male: [
      'Dex', 'Kane', 'Raze', 'Jax', 'Cole', 'Viktor', 'Rex', 'Nero', 'Zeke', 'Mack',
      'Axel', 'Blade', 'Cruz', 'Dane', 'Edge', 'Fuse', 'Ghost', 'Hex', 'Ice', 'Jinx',
      'Knox', 'Lux', 'Mox', 'Nox', 'Oz', 'Pax', 'Rix', 'Syx', 'Trace', 'Vex',
      'Warp', 'Xero', 'Yuri', 'Zed', 'Ajax', 'Bolt', 'Crash', 'Drift', 'Ember', 'Flare'
    ],
    female: [
      'Vera', 'Kira', 'Roxy', 'Jade', 'Sasha', 'Nova', 'Mira', 'Zara', 'Nyx', 'Vex',
      'Aurora', 'Bliss', 'Cleo', 'Diva', 'Echo', 'Faye', 'Glow', 'Haze', 'Ivy', 'Jinx',
      'Karma', 'Luna', 'Moxie', 'Neon', 'Onyx', 'Pulse', 'Quinn', 'Riot', 'Silk', 'Trinity',
      'Unity', 'Viper', 'Wren', 'Xyla', 'Yuki', 'Zena', 'Alias', 'Blaze', 'Circuit', 'Delta'
    ],
    other: ['Zero', 'Rune', 'Cipher', 'Neon', 'Glitch', 'Flux', 'Chrome', 'Pixel', 'Hex', 'Byte', 'Static', 'Synth', 'Vector', 'Warp', 'Grid'],
    lastNames: ['Chrome', 'Neon', 'Wire', 'Blade', 'Volt', 'Spark', 'Grid', 'Core', 'Link', 'Node', 'Sync', 'Flux', 'Pulse', 'Wave', 'Edge'],
  },
  western: {
    male: [
      'Jack', 'William', 'Samuel', 'Thomas', 'Henry', 'James', 'Wyatt', 'Cole', 'Jesse', 'Eli',
      'Amos', 'Buck', 'Clint', 'Dalton', 'Earl', 'Frank', 'Gus', 'Hank', 'Isaac', 'Jeb',
      'Kit', 'Luke', 'Micah', 'Ned', 'Otis', 'Pete', 'Quaid', 'Rusty', 'Silas', 'Tex',
      'Virgil', 'Wade', 'Zach', 'Austin', 'Boone', 'Caleb', 'Duke', 'Emmett', 'Floyd', 'Garrett'
    ],
    female: [
      'Mary', 'Sarah', 'Emma', 'Grace', 'Rose', 'Clara', 'Annie', 'Lily', 'Ruth', 'Pearl',
      'Ada', 'Belle', 'Cora', 'Dolly', 'Eliza', 'Flora', 'Georgia', 'Hattie', 'Ida', 'Jane',
      'Kate', 'Lottie', 'Maggie', 'Nell', 'Olive', 'Patience', 'Queenie', 'Rebecca', 'Sadie', 'Tillie',
      'Una', 'Violet', 'Willa', 'Zelda', 'Abigail', 'Bonnie', 'Clementine', 'Daisy', 'Esther', 'Faith'
    ],
    other: ['Dakota', 'Carson', 'Morgan', 'Riley', 'Jesse', 'Quinn', 'Sage', 'Reese', 'Lane', 'Arden', 'Blaine', 'Dusty', 'Finley', 'Hadley', 'Raven'],
    lastNames: ['Earp', 'Holliday', 'Masterson', 'Garrett', 'Cassidy', 'Hickok', 'Cody', 'Oakley', 'Carson', 'Bridger', 'Crockett', 'Boone', 'Maverick', 'Longley', 'Hardin'],
  },
  horror: {
    male: [
      'Thomas', 'Edward', 'Victor', 'Charles', 'Henry', 'William', 'James', 'Robert', 'Arthur', 'George',
      'Aldous', 'Bernard', 'Cornelius', 'Damien', 'Edgar', 'Frederick', 'Gerald', 'Harold', 'Irving', 'Julian',
      'Klaus', 'Lawrence', 'Malcolm', 'Nathaniel', 'Oscar', 'Percival', 'Quentin', 'Roderick', 'Sebastian', 'Theodore',
      'Ulysses', 'Vincent', 'Walter', 'Xavier', 'Yves', 'Zachariah', 'Ambrose', 'Bartholomew', 'Cassius', 'Demetrius'
    ],
    female: [
      'Elizabeth', 'Mary', 'Victoria', 'Catherine', 'Rose', 'Clara', 'Evelyn', 'Margaret', 'Ruth', 'Helen',
      'Abigail', 'Beatrice', 'Cordelia', 'Drusilla', 'Edith', 'Florence', 'Gertrude', 'Harriet', 'Isadora', 'Josephine',
      'Katarina', 'Lenore', 'Millicent', 'Nora', 'Ophelia', 'Prudence', 'Rosemary', 'Sybil', 'Theodora', 'Una',
      'Vera', 'Winifred', 'Xenia', 'Yvette', 'Zelda', 'Agatha', 'Blanche', 'Clarice', 'Delilah', 'Esmeralda'
    ],
    other: ['Morgan', 'Raven', 'Quinn', 'Ash', 'Blair', 'Salem', 'Shadow', 'Vesper', 'Crow', 'Winter', 'Onyx', 'Wraith', 'Phantom', 'Shade', 'Dusk'],
    lastNames: ['Blackwood', 'Ravenscroft', 'Thornwood', 'Darkholme', 'Graves', 'Nightshade', 'Crowley', 'Ashford', 'Holloway', 'Grimshaw', 'Mortimer', 'Bathory', 'Carfax', 'Harker', 'Westenra'],
  },
  noir: {
    male: [
      'Jack', 'Vincent', 'Frank', 'Sam', 'Tony', 'Mickey', 'Lou', 'Eddie', 'Charlie', 'Max',
      'Al', 'Bruno', 'Carlo', 'Danny', 'Felix', 'Gino', 'Harry', 'Izzy', 'Joe', 'Kid',
      'Leo', 'Marco', 'Nick', 'Otto', 'Paulie', 'Rocco', 'Sal', 'Tommy', 'Vito', 'Willie',
      'Ace', 'Benny', 'Chick', 'Dutch', 'Frankie', 'Georgie', 'Hymie', 'Jake', 'Lucky', 'Moose'
    ],
    female: [
      'Vivian', 'Carmen', 'Stella', 'Rose', 'Gloria', 'Vera', 'Dolores', 'Rita', 'Lana', 'Ruby',
      'Ava', 'Betty', 'Clara', 'Dottie', 'Evelyn', 'Faye', 'Gilda', 'Helen', 'Irene', 'Jane',
      'Kay', 'Lola', 'Mona', 'Nora', 'Olive', 'Pearl', 'Queenie', 'Ruth', 'Sylvia', 'Trixie',
      'Velma', 'Wanda', 'Zelda', 'Angie', 'Bunny', 'Claudette', 'Dixie', 'Esther', 'Fifi', 'Ginger'
    ],
    other: ['Morgan', 'Jackie', 'Lou', 'Sal', 'Bernie', 'Pat', 'Alex', 'Riley', 'Casey', 'Terry', 'Angel', 'Frankie', 'Nicky', 'Ricky', 'Sandy'],
    lastNames: ['Marlowe', 'Spade', 'Hammer', 'Archer', 'Gittes', 'Cross', 'Vance', 'Milano', 'Corleone', 'Luciano', 'Capone', 'Genovese', 'Costello', 'Gambino', 'Bonanno'],
  },
  post_apocalyptic: {
    male: [
      'Max', 'Rex', 'Cole', 'Kane', 'Jax', 'Zeke', 'Ash', 'Stone', 'Flint', 'Hawk',
      'Axe', 'Blade', 'Crag', 'Diesel', 'Edge', 'Forge', 'Grit', 'Haze', 'Iron', 'Jet',
      'Kade', 'Lock', 'Mace', 'Nix', 'Ox', 'Pike', 'Rad', 'Slag', 'Tank', 'Vault',
      'War', 'Xerxes', 'Yager', 'Zero', 'Bane', 'Cinder', 'Doom', 'Fang', 'Grave', 'Havoc'
    ],
    female: [
      'Max', 'Ripley', 'Sage', 'Raven', 'Storm', 'Wren', 'Ember', 'Rust', 'Vera', 'Thorne',
      'Ash', 'Blaze', 'Cinder', 'Dawn', 'Echo', 'Fury', 'Grim', 'Haze', 'Ivy', 'Jinx',
      'Karma', 'Luna', 'Mercy', 'Nova', 'Onyx', 'Phoenix', 'Quinn', 'Rogue', 'Sable', 'Trinity',
      'Unity', 'Viper', 'Willow', 'Xena', 'Yara', 'Zephyr', 'Ashes', 'Blight', 'Crow', 'Dust'
    ],
    other: ['Ash', 'Raven', 'Storm', 'Rust', 'Bone', 'Slate', 'Flint', 'Ember', 'Echo', 'Ghost', 'Wraith', 'Shade', 'Cipher', 'Nomad', 'Scout'],
    lastNames: ['Wasteland', 'Scavenger', 'Roadkill', 'Dustwalker', 'Ironside', 'Bonecrusher', 'Ashfall', 'Bloodstone', 'Deathwalker', 'Fallout'],
  },
  steampunk: {
    male: [
      'Theodore', 'Archibald', 'Edmund', 'Jasper', 'Oliver', 'Arthur', 'Percival', 'Cornelius', 'Reginald', 'Barnaby',
      'Alistair', 'Bartholomew', 'Cecil', 'Desmond', 'Erasmus', 'Fitzwilliam', 'Gideon', 'Horatio', 'Ignatius', 'Jeremiah',
      'Kingsley', 'Leopold', 'Montgomery', 'Nigel', 'Oswald', 'Phineas', 'Quigley', 'Rupert', 'Sebastian', 'Thaddeus',
      'Ulysses', 'Verne', 'Wellington', 'Xavier', 'Yardley', 'Zebediah', 'Aldous', 'Benedict', 'Clarence', 'Dudley'
    ],
    female: [
      'Adelaide', 'Beatrice', 'Cordelia', 'Eugenia', 'Florence', 'Harriet', 'Imogen', 'Josephine', 'Lavinia', 'Millicent',
      'Agatha', 'Bernadette', 'Clementine', 'Dorothea', 'Evangeline', 'Felicity', 'Genevieve', 'Henrietta', 'Isadora', 'Jemima',
      'Katarina', 'Lucinda', 'Marguerite', 'Nathania', 'Octavia', 'Penelope', 'Quintessa', 'Rosalind', 'Seraphina', 'Thomasina',
      'Ursula', 'Vivienne', 'Winifred', 'Xanthe', 'Yvonne', 'Zenobia', 'Arabella', 'Brunhilde', 'Cassandra', 'Desdemona'
    ],
    other: ['Sterling', 'Ashby', 'Emery', 'Morgan', 'Finley', 'Aubrey', 'Bellamy', 'Everett', 'Harper', 'Kendall', 'Leighton', 'Marlowe', 'Pemberton', 'Remington', 'Sinclair'],
    lastNames: ['Cogsworth', 'Steamwhistle', 'Gearhart', 'Brassington', 'Clockwork', 'Ironwing', 'Copperfield', 'Steamford', 'Boltwright', 'Piston', 'Sprocket', 'Whistledown', 'Brassworth', 'Gearson', 'Tinkerbell'],
  },
  pirate: {
    male: [
      'Jack', 'William', 'Edward', 'James', 'Henry', 'Thomas', 'Charles', 'Robert', 'Samuel', 'Benjamin',
      'Bartholomew', 'Calico', 'Drake', 'Edmund', 'Flint', 'Gideon', 'Hawkins', 'Ignacio', 'Jonas', 'Kidd',
      'Long', 'Morgan', 'Nemo', 'Ollie', 'Pedro', 'Quartermaster', 'Redbeard', 'Smitty', 'Teach', 'Ulric',
      'Vane', 'Willy', 'Xavier', 'Yorke', 'Zephyr', 'Angus', 'Blackbeard', 'Cutlass', 'Diego', 'Ezra'
    ],
    female: [
      'Anne', 'Mary', 'Grace', 'Elizabeth', 'Charlotte', 'Isabella', 'Margaret', 'Catherine', 'Sarah', 'Rachel',
      'Arabella', 'Bonny', 'Coral', 'Delphine', 'Esmeralda', 'Fiona', 'Gwendolyn', 'Helena', 'Iris', 'Jacqueline',
      'Katrina', 'Luna', 'Marina', 'Nadia', 'Ophelia', 'Pearl', 'Quinn', 'Rosalie', 'Scarlett', 'Tempest',
      'Una', 'Valentina', 'Wren', 'Xanthe', 'Yvette', 'Zara', 'Anastasia', 'Brigitte', 'Camille', 'Dominique'
    ],
    other: ['Morgan', 'Sailor', 'Stormy', 'Sandy', 'Reef', 'Coral', 'Tide', 'Wave', 'Anchor', 'Compass', 'Mast', 'Rigging', 'Salty', 'Barnacle', 'Gull'],
    lastNames: ['Sparrow', 'Blackbeard', 'Flint', 'Bones', 'Silver', 'Hook', 'Turner', 'Barbossa', 'Teach', 'Kidd', 'Morgan', 'Rackham', 'Bonny', 'Read', 'Vane'],
  },
  war: {
    male: [
      'Jack', 'John', 'William', 'James', 'Robert', 'Thomas', 'Henry', 'Charles', 'George', 'Edward',
      'Alexander', 'Benjamin', 'Christopher', 'Daniel', 'Ethan', 'Franklin', 'Gregory', 'Harrison', 'Isaac', 'Jacob',
      'Kenneth', 'Leonard', 'Marcus', 'Nathan', 'Oscar', 'Patrick', 'Quentin', 'Raymond', 'Samuel', 'Theodore',
      'Victor', 'Walter', 'Xavier', 'Yuri', 'Zachary', 'Ajax', 'Blaze', 'Cobra', 'Duke', 'Eagle'
    ],
    female: [
      'Sarah', 'Emily', 'Jessica', 'Rachel', 'Nicole', 'Amanda', 'Megan', 'Lauren', 'Natalie', 'Samantha',
      'Alexandra', 'Brianna', 'Catherine', 'Diana', 'Elizabeth', 'Francesca', 'Gabriella', 'Helena', 'Isabella', 'Julia',
      'Katherine', 'Lydia', 'Maria', 'Nancy', 'Olivia', 'Patricia', 'Rebecca', 'Sophia', 'Teresa', 'Victoria',
      'Wendy', 'Xena', 'Yvonne', 'Zoe', 'Athena', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot'
    ],
    other: ['Jordan', 'Alex', 'Taylor', 'Casey', 'Riley', 'Morgan', 'Avery', 'Quinn', 'Jamie', 'Drew', 'Scout', 'Ranger', 'Falcon', 'Phoenix', 'Storm'],
    lastNames: ['Miller', 'Johnson', 'Williams', 'Brown', 'Davis', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson'],
  },
  mystery: {
    male: [
      'Holmes', 'Watson', 'Marlowe', 'Spade', 'Archer', 'Poirot', 'Marple', 'Wolfe', 'Hammer', 'Monk',
      'Benedict', 'Charles', 'Dashiell', 'Edmund', 'Fletcher', 'Gregory', 'Harrison', 'Irving', 'Jonathan', 'Kenneth',
      'Lawrence', 'Malcolm', 'Nigel', 'Oscar', 'Percival', 'Quincy', 'Raymond', 'Sebastian', 'Theodore', 'Victor',
      'Warren', 'Xavier', 'Yale', 'Zachary', 'Augustus', 'Bradford', 'Cornelius', 'Douglas', 'Elliot', 'Francis'
    ],
    female: [
      'Victoria', 'Eleanor', 'Catherine', 'Margaret', 'Elizabeth', 'Agatha', 'Dorothy', 'Harriet', 'Nancy', 'Veronica',
      'Alexandra', 'Beatrice', 'Cordelia', 'Diana', 'Evelyn', 'Florence', 'Gertrude', 'Helena', 'Iris', 'Josephine',
      'Katherine', 'Lenore', 'Millicent', 'Nora', 'Ophelia', 'Patricia', 'Rosemary', 'Sybil', 'Theodora', 'Una',
      'Vivian', 'Winifred', 'Xena', 'Yvette', 'Zelda', 'Ada', 'Blanche', 'Clarice', 'Delphine', 'Esther'
    ],
    other: ['Morgan', 'Raven', 'Quinn', 'Ash', 'Blair', 'Jordan', 'Alex', 'Taylor', 'Casey', 'Riley', 'Parker', 'Hunter', 'Scout', 'Sloane', 'Finley'],
    lastNames: ['Christie', 'Doyle', 'Chandler', 'Hammett', 'Sayers', 'Marsh', 'Stout', 'Grafton', 'Cornwell', 'Patterson', 'Burke', 'Cross', 'Stone', 'Blackwell', 'Thorne'],
  },
  default: {
    male: [
      'Marcus', 'Erik', 'Darius', 'Finn', 'Gareth', 'Roland', 'Theron', 'Vance', 'Aldric', 'Drake',
      'Alexander', 'Benjamin', 'Charles', 'David', 'Edward', 'Frederick', 'Gregory', 'Henry', 'Isaac', 'James',
      'Kenneth', 'Leonard', 'Michael', 'Nathan', 'Oliver', 'Patrick', 'Quentin', 'Robert', 'Samuel', 'Thomas'
    ],
    female: [
      'Elena', 'Lyra', 'Thea', 'Vera', 'Aria', 'Brynn', 'Diana', 'Evelyn', 'Helena', 'Kira',
      'Alexandra', 'Beatrice', 'Catherine', 'Diana', 'Elizabeth', 'Fiona', 'Grace', 'Hannah', 'Isabella', 'Julia',
      'Katherine', 'Lydia', 'Maria', 'Natalie', 'Olivia', 'Patricia', 'Rebecca', 'Sophia', 'Victoria', 'Wendy'
    ],
    other: ['Rowan', 'Sage', 'River', 'Ash', 'Phoenix', 'Quinn', 'Morgan', 'Raven', 'Storm', 'Wren', 'Ember', 'Onyx', 'Vale', 'Cypress', 'Finley'],
    lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Anderson', 'Taylor'],
  },
};

// Helper to get names for current genre (with optional last name generation)
export const getGenreNames = (genreStr: string): { male: string[]; female: string[]; other: string[]; lastNames?: string[] } => {
  const raw = (genreStr || 'fantasy').toLowerCase().replace(/[_\s-]/g, '');
  
  // Map all possible genre variants to canonical keys
  const genreMap: Record<string, string> = {
    fantasy: 'fantasy',
    modern: 'modern',
    modernlife: 'modern_life',
    modern_life: 'modern_life',
    scifi: 'scifi',
    sci_fi: 'scifi',
    science_fiction: 'scifi',
    cyberpunk: 'cyberpunk',
    cyber_punk: 'cyberpunk',
    western: 'western',
    noir: 'noir',
    postapoc: 'post_apocalyptic',
    postapocalyptic: 'post_apocalyptic',
    post_apocalyptic: 'post_apocalyptic',
    steampunk: 'steampunk',
    steam_punk: 'steampunk',
    pirate: 'pirate',
    war: 'war',
    horror: 'horror',
    mystery: 'mystery',
  };
  
  const normalized = genreMap[raw] || genreMap[raw.replace(/_/g, '')] || 'default';
  return GENRE_NAMES[normalized] || GENRE_NAMES.default;
};

// Generate a full name with optional last name based on genre
export const generateFullName = (genreStr: string, gender: 'male' | 'female' | 'other'): string => {
  const names = getGenreNames(genreStr);
  const firstNames = names[gender] || names.other;
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  
  // 70% chance to include a last name if available
  if (names.lastNames && names.lastNames.length > 0 && Math.random() < 0.7) {
    const lastName = names.lastNames[Math.floor(Math.random() * names.lastNames.length)];
    return `${firstName} ${lastName}`;
  }
  
  return firstName;
};
