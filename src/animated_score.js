/*
	Animated Score
	Joaquín Ruaimi
	https://github.com/joaquinrmi/animated-score
*/

/*
	Esta clase representa a una acción importante en la reproducción de una pieza musical.
	Puede ser de tipo:
		# Note
		# Tempo
*/
class MusicAction
{
	constructor(type)
	{
		this.type = type;
	}
};

/*
	Tipo de MusicAction que representa una nota musical.
*/
class Note extends MusicAction
{
	/*
		"note" es un número del 0 al 11 que identifica una de las 12 notas del sistema occidental.
		"octave" es la octava de la nota, la cual va desde 0 a 6.
		"duration" es la duración de la nota en cantidades enteras, cuya unidad es la duración de una semifusa.
	*/
	constructor(note, octave, duration)
	{
		super("note");

		this.note = note;
		this.octave = octave;
		this.duration = duration;
	}
};

/*
	Tipo de MusicAction que anuncia un cambio de tempo en la ejecución de la pieza musical.
*/
class Tempo extends MusicAction
{
	/*
		"tempo" es un número cuya unidad son las pulsaciones de una negra por minuto. Este valor no afecta a la velocidad de reproducción de AnimatedScore, pero sí afecta a la duración de las notas.
	*/
	constructor(tempo)
	{
		super("tempo");

		this.tempo = typeof tempo == "number" ? tempo : 120;
	}
};

class AnimatedScore
{
	/*
		"args" debe ser un objeto con los siguientes campos:
			> containerId: (string) id del elemento que contendrá el <canvas> de la partitura.
			> framerate: (number) (opcional) cantidad de cuadros por segundo. Por defecto es 60.
			> playingVelocity: (number) (opcional) velocidad en pixeles/segundo de la animación, por defecto se establece en 200 pixeles/segundo. No afecta a la duración de las notas.
	*/
	constructor(args)
	{
		if(typeof args != "object")
		{
			throw "args debe ser un objeto";
		}

		if(typeof args.containerId != "string")
		{
			throw "args.containerId debe ser un string";
		}

		if(typeof args.playingVelocity == "number")
		{
			this.velocity = args.playingVelocity;
		}
		else
		{
			this.velocity = 200;
		}

		if(typeof args.framerate == "number" && args.framerate > 0)
		{
			this.framerate = args.framerate;
		}
		else
		{
			this.framerate = 60;
		}

		const imgId = {
			note1: ["note-1"],
			note2: ["note-2", "note-2t"],
			note4: ["note-4", "note-4t"],
			note8: ["note-8", "note-8t"],
			note16: ["note-16", "note-16t"],
			note32: ["note-32", "note-32t"],
			note64: ["note-64", "note-64t"],
			quaverBase: ["note-base"]
		};

		const imgNames = [
			"note1", "note2", "note4", "note8", "note16", "note32", "note64", "quaverBase"
		];

		/*
			Cargar las imágenes desde las etiquetas definidas en el documento.
			Si una imagen con el id requerido no existe, se mostrará un error por consola, pero la ejecución no se detendrá.
		*/
		this.imgs = {};
		for(var i in imgNames)
		{
			const name = imgNames[i];

			this.imgs[name] = [];

			for(var j in imgId[name])
			{
				const id = imgId[name][j];

				var res = document.getElementById(id);
				if(res == null)
				{
					console.error("No se ha encontrado el recurso \"" + id + "\"");
					continue;
				}

				this.imgs[name].push(res);
			}
		}

		this.scoreContainer = document.getElementById(args.containerId);
		if(this.scoreContainer == null)
		{
			throw "no se encontró ningún elemento con id " + args.containerId;
		}

		this.canvasPadding = 20;
		this.scoreHeight = 29;

		/*
			Creación del canvas.
			Su ancho será igual al ancho del contenedor.
		*/
		this.canvas = document.createElement("canvas");

		const containerDimensions = this.scoreContainer.getBoundingClientRect();
		this.canvas.width = containerDimensions.width;
		this.canvas.height = this.scoreHeight + 2 * this.canvasPadding;
		this.canvas.style.backgroundColor = "white";

		this.scoreContainer.appendChild(this.canvas);

		this.context = this.canvas.getContext("2d");

		this.loopID = 0;
		this.status = "stopped";
	}

	start()
	{
		if(this.status != "playing")
		{
			this.status = "playing";
			this.loopID = setInterval(this.mainLoop.bind(this), 1000 / this.framerate);
		}
	}

	pause()
	{
		this.status = "paused";
		clearInterval(this.loopID);
	}

	stop()
	{
		this.status = "stopped";
		this.reset();
		clearInterval(this.loopID);
	}

	reset()
	{}

	/*
		Crea una nueva secuencia de notas visuales para reproducir en la animación.
		"actions" es un arreglo de MusicAction.
	*/
	setMusicActions(actions)
	{}

	mainLoop()
	{
		this.update();
		this.draw();
	}

	update()
	{}

	draw()
	{
		this.drawScoreLines(this.context);
	}
	
	drawScoreLines(context)
	{
		for(var i = 0; i < 5; ++i)
		{
			context.beginPath();
			context.moveTo(0, this.canvasPadding + i * 7 + 0.5);
			context.lineTo(this.canvas.width, this.canvasPadding + i * 7 + 0.5);
			context.strokeStyle = "black";
			context.lineWidth = 1;
			context.stroke();
		}
	}
};