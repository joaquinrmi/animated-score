# Animated Score

Animated Score es una partitura animada en `<canvas>` que puede ser configurada para representar visualmente la reproducción de una pieza musical.

## Por qué este proyecto

La idea de Animated Score surgió debido a la necesidad de incluir una partitura animada en otro de mis proyectos, llamado Melody, que actualmente estoy desarrollando. El proyecto me gustó tanto que decidí adaptar su código y crearle un repositorio propio.

## Características

* Todas las figuras musicales: redonda, blanca, negra, corchea, semicorchea, fusa y semifusa.
* Dos claves: la Clave de sol en segunda y la Clave de fa en cuarta.

## Futuras características

* Sostenidos y bemoles.
* Silencios.
* Ligaduras.
* Más claves.

## Forma de uso

### Creando objeto `AnimatedScore`

Se comienza creando un nuevo objeto de la clase `AnimatedScore` pasándole como argumento del constructor un objeto con las siguientes propiedades:
* `containerId`: el id del elemento del DOM que contendrá el `canvas`.
* `framerate`: (opcional) la cantidad de cuadros por segundo.
* `playingVelocity`: (opcional) la velocidad de la animación, medida en pixeles por segundo.
```js
const animatedScore = new AnimatedScore({
   containerId: "score-container",
   framerate: 60,
   playingVelocity: 200
});
```

### Acciones

La carga de información se hace mediante los objetos `MusicAction`, que establecen qué acción debe hacer el objeto `animatedScore` para mostrar correctamente los elementos en pantalla.
Por el momento, solo se han implementado dos acciones: las notas y el cambio de tempo.

### Acciones: `Note`

Para crear una nota, se crea un nuevo objeto de la clase `Note`. Se debe suministrarle tres parámetros a su constructor:
* `note`: un número del 0 al 11 que representa una de las 12 notas del sistema armónico.
* `octave`: la octava de la nota, un número que va desde el 0 al 6.
* `duration`: la duración de la nota, medida en múltiplos de la duración de una semifusa. Por ejemplo, la duración de una corchea será `8`, porque 8 semifusas hacen una corchea. Notar que esta duración es independiente del tempo.
```js
const note = new Note(0, 3, 64); // Do central con duración de una redonda.
```

### Acciones: `Tempo`

De la misma forma se puede crear un objeto `Tempo`, pasándole a su constructor las pulsaciones de una negra por minuto.
```js
const tempo = new Tempo(132);
```

### Cargando las acciones

Primero se deben agrupar todas las acciones en un arreglo y luego pasar ese arreglo como argumento de la función `AnimatedScore.setMusicActions()`.
```js
const actions = [
	new Tempo(60),
	new Note(0, 3, 16),
	new Note(2, 3, 16),
	new Note(4, 3, 16)
];

animatedScore.setMusicActions(actions);
```

### Control de la reproducción

Para controlar la reproducción se disponen de los métodos `start()`, `pause()` y `stop()`.