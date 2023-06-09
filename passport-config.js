const LocalStrategy = require('passport-local').Strategy;
const BufeteUser = require('./models/bufeteUser'); // Asegúrate de que la ruta sea correcta

module.exports = function(passport) {
  passport.use(
    new LocalStrategy({ usernameField: 'username' }, async (username, password, done) => {
      try {
        const user = await BufeteUser.findOne({ 
          $or: [
              { username: username },
              { email: username }
          ]
      });

        if (!user) {
          
          return done(null, false, { message: 'Usuario no encontrado' });
        }

        

        const isMatch = await user.comparePassword(password);

        if (isMatch) {
          
          return done(null, user);
        } else {
          
          return done(null, false, { message: 'Contraseña incorrecta' });
        }
      } catch (error) {
        console.error('Error en la estrategia local:', error);
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await BufeteUser.findById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
};
