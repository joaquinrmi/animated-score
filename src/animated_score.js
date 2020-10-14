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

/*
	Dimensiones útiles de la partitura.
*/
class ScoreDimensions
{
	constructor(height, padding)
	{
		this.height = height;
		this.padding = padding;
	}
};

/*
	Representa cada uno de los símbolos musicales.
*/
class NoteSymbol
{
	/*
		"img" es el elemento <img> del DOM.
		"corner" es la esquina superior izquierda de la nota.
		"duration" es la duración en segundos de la nota.
	*/
	constructor(img, corner, duration)
	{
		this.img = img;
		this.corner = corner;
		this.duration = duration;
	}
};

class VisualNote
{
	constructor(symbol, tempo, verticalPos, scoreDimensions)
	{
		this.img = symbol.img;
		this.verticalPos = verticalPos;
		this.x = 0;
		this.y = scoreDimensions.padding + scoreDimensions.height - verticalPos * 3.5 - symbol.corner + 2.5;
		this.duration = symbol.duration * (tempo / 120);
	}

	draw(context)
	{
		context.drawImage(this.img, this.x, this.y);
	}

	changeSymbol(symbol, scoreDimensions)
	{
		this.img = symbol.img;
		this.y = scoreDimensions.padding + scoreDimensions.height - this.verticalPos * 3.5 - symbol.corner + 2.5;
	}
}

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

		this.scoreDimensions = new ScoreDimensions(this.scoreHeight, this.canvasPadding);

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

		/*
			Duración en segundos de las notas a 120 pulsaciones de negra por minuto.
			El orden va desde la redonda hasta la semifusa.
			Por supuesto, estos valores son fácilmente calculables, pero creo más conveniente tenerlos a disposición sin recurrir a cálculos que puedan entorpezer el código.
		*/
		this.noteDuration = [
			2, 1, 0.5, 0.25, 0.125, 0.0625, 0.03125
		];

		/*
			Duración de cada nota en términos de una semifusa.
			El orden va desde la redonda hasta la semifusa.
		*/
		this.noteFraqDuration = [
			64, 32, 16, 8, 4, 2, 1
		];

		/*
			Posición vertical en el pentagrama de cada una de las 12 notas.
			Las posiciones son relativas y dependen de la clave usada.
		*/
		this.noteVerticalPos = [
			0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6
		];

		this.noteSymbols = [
			[
				new NoteSymbol(this.imgs["note1"][0], 6, this.noteDuration[0]),
				new NoteSymbol(this.imgs["note1"][0], 6, this.noteDuration[0]),
			],
			[
				new NoteSymbol(this.imgs["note2"][0], 26, this.noteDuration[1]),
				new NoteSymbol(this.imgs["note2"][1], 6, this.noteDuration[1]),
			],
			[
				new NoteSymbol(this.imgs["note4"][0], 26, this.noteDuration[2]),
				new NoteSymbol(this.imgs["note4"][1], 6, this.noteDuration[2]),
			],
			[
				new NoteSymbol(this.imgs["note8"][0], 26, this.noteDuration[3]),
				new NoteSymbol(this.imgs["note8"][1], 6, this.noteDuration[3]),
			],
			[
				new NoteSymbol(this.imgs["note16"][0], 26, this.noteDuration[4]),
				new NoteSymbol(this.imgs["note16"][1], 6, this.noteDuration[4]),
			],
			[
				new NoteSymbol(this.imgs["note32"][0], 26, this.noteDuration[5]),
				new NoteSymbol(this.imgs["note32"][5], 6, this.noteDuration[5]),
			],
			[
				new NoteSymbol(this.imgs["note64"][0], 26, this.noteDuration[6]),
				new NoteSymbol(this.imgs["note64"][1], 6, this.noteDuration[6]),
			],
		];

		/*
			Establece el tiempo en milisegundos en el que se debe reproducir una nota.
			Este tiempo se utiliza para ubicar la nota horizontalmente en el pentagrama.
		*/
		this.noteTime = [];

		this.visualNotes = [];

		this.playerLinePos = this.canvas.width / 2;
		this.playerLineColor = "blue";

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
	{
		if(!(actions instanceof Array))
		{
			return;
		}

		/*
			Propiedades de la generación que se irán modificando con cada MusicAction.
			"currentTempo" es el tempo con el que se cargará la nota actual.
			"x" es la posición horizontal en el pentagrama de la nota actual.
		*/
		this.gen = {
			currentTempo: 120,
			x: this.playerLinePos
		};

		for(var i = 0; i < actions.length; ++i)
		{
			switch(actions[i].type)
			{
			case "note":
				this.registerNote(actions[i]);
				break;

			case "tempo":
				this.gen.currentTempo = actions[i].tempo;
				break;
			}
		}

		/*
			Se dibuja por primera vez para visualizar las notas en la linea de partida.
		*/
		this.draw();
	}

	mainLoop()
	{
		this.update();
		this.draw();
	}

	update()
	{}

	draw()
	{
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

		this.drawScoreLines(this.context);

		this.drawNotes(this.context);

		this.drawPlayerLine(this.context);
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

	drawPlayerLine(context)
	{
		context.beginPath();
		context.moveTo(this.playerLinePos, this.canvasPadding - 10);
		context.lineTo(this.playerLinePos, this.canvasPadding + this.scoreHeight + 10);
		context.strokeStyle = this.playerLineColor;
		context.lineWidth = 2;
		context.stroke();
	}

	drawNotes(context)
	{
		for(var i = 0; i < this.visualNotes.length; ++i)
		{
			this.visualNotes[i].draw(context);
		}
	}

	registerNote(note)
	{
		var time = 0;

		this.noteTime.push(time);

		var vn = this.createVisualNotes(note);
		for(var i = 0; i < vn.length; ++i)
		{
			var visualNote = vn[i];

			visualNote.x = this.gen.x;

			this.gen.x += visualNote.duration * this.velocity;

			this.visualNotes.push(visualNote);
		}
	}

	createVisualNotes(note)
	{
		const symbolIds = [];

		/*
			En la siguiente sección se encuentra el o la combinación adecuada de símbolos cuyas duraciones sumadas sean igual a la duración de la nota actual.
		*/
		var r = note.duration;
		for(var i = 0; i < this.noteFraqDuration.length; ++i)
		{
			if(this.noteFraqDuration[i] <= r)
			{
				symbolIds.push(i);
				r -= this.noteFraqDuration[i];
				if(r == 0) break;
			}
		}

		/*
			Cada nota tiene un identificador numérico único dentro del sistema occidental.
		*/
		const noteID = note.note + note.octave * 12;

		/*
			Se le asigna la clave de Fa a las notas de las tres octavas más graves y a todas las demás se le asigna la clave de Sol.
		*/
		var clavier;
		if(noteID < 12 * 3) clavier = "F";
		else clavier = "G";

		var visualNotes = [];
		for(var i = 0; i < symbolIds.length; ++i)
		{
			const id = symbolIds[i];
			const verticalPos = this.getNoteVerticalPos(note, clavier);
			const symbol = verticalPos > 3 ? this.noteSymbols[id][1] : this.noteSymbols[id][0];

			visualNotes.push(new VisualNote(
				symbol,
				this.gen.currentTempo,
				verticalPos,
				this.scoreDimensions
			));
		}

		return visualNotes;
	}

	/*
		Calcula y devuelve la posición vertical en el pentagrama para una nota.
		Este valor depende de la clave usada.
	*/
	getNoteVerticalPos(note, clavier)
	{
		var verticalPos = this.noteVerticalPos[note.note];

		switch(clavier)
		{
		case "G":
			verticalPos += -2 + (note.octave - 3) * 7;
			break;

		case "F":
			verticalPos += -4 + (note.octave - 1) * 7;
			break;
		}

		return verticalPos;
	}
};