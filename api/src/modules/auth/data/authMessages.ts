export const authMessages = {
  name: {
    IsNotEmpty: 'El Nombre es requerido',
    IsString: 'El Nombre debe ser un texto',
    Length: 'El Nombre debe tener un mínimo de 3 y máximo de 100 letras',
  },

  email: {
    IsNotEmpty: 'El Email es requerido',
    IsEmail: 'Asegurate de escribir un correo electrónico',
  },

  password: {
    IsNotEmpty: 'La Contraseña es requerida',
    IsString: 'La Contraseña debe ser un texto',
    Lengh: 'La Contraseña debe tener un mínimo de 8 y máximo de 100 caracteres',
    Matches: 'La Contraseña debe contener al menos una mayúscula, una minúscula, un número y un símbolo',
  },

  role: {
    IsNotEmpty: 'debes seleccionar un rol',
  },
};
