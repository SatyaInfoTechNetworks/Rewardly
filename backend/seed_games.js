const Game = require('./src/models/Game');
const { sequelize } = require('./src/config/database');

async function seedGames() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');

    const [game, created] = await Game.findOrCreate({
      where: { slug: 'flappy-bird' },
      defaults: {
        name: 'Flappy Bird',
        type: 'canvas_2d',
        thumbnail_url: 'https://i.ibb.co/v3m0rPq/flappy-thumb.png',
        config: {
          gravity: 0.25,
          jumpForce: -5,
          pipeSpeed: 2,
          pipeGap: 120
        },
        status: 'active'
      }
    });

    if (created) {
      console.log('✅ Flappy Bird game seeded!');
    } else {
      console.log('ℹ️ Flappy Bird already exists.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding Error:', err);
    process.exit(1);
  }
}

seedGames();
