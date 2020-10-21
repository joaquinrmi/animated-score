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
		this.duration = symbol.duration * (120 / tempo);
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

/*
	Linea vertical de una nota.
*/
class NoteLine
{
	constructor(x, y, large)
	{
		this.x = x;
		this.y = y;
		this.large = large;
		this.color = "black";
	}

	draw(context)
	{
		context.strokeStyle = this.color;
		context.beginPath();
		context.moveTo(this.x, this.y);
		context.lineTo(this.x, this.y + this.large);
		context.lineWidth = 1;
		context.stroke();
	}
};

/*
	Línea horizontal que forma parte de una sección de corcheas.
*/
class QuaverSection
{
	constructor(x, y, toX, toY)
	{
		this.x = x;
		this.y = y;
		this.toX = toX;
		this.toY = toY;
		this.color = "black";
	}

	draw(context)
	{
		context.strokeStyle = this.color;
		context.beginPath();
		context.moveTo(this.x, this.y);
		context.lineTo(this.toX, this.toY);
		context.lineWidth = 3;
		context.stroke();
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
			quaverBase: ["note-base"],
			f_clavier: ["f-clavier"],
			g_clavier: ["g-clavier"]
		};

		const imgNames = [
			"note1", "note2", "note4", "note8", "note16", "note32", "note64", "quaverBase",
			"f_clavier", "g_clavier"
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
			[
				new NoteSymbol(this.imgs.quaverBase[0], 6, 0),
				new NoteSymbol(this.imgs.quaverBase[0], 6, 0)
			]
		];

		/*
			Establece el tiempo en milisegundos en el que se debe reproducir una nota.
			Este tiempo se utiliza para ubicar la nota horizontalmente en el pentagrama.
		*/
		this.noteTime = [];

		this.visualNotes = [];

		this.quaverSections = [];
		this.noteLines = [];

		this.firstLine = 0;
		this.lastLine = 0;

		this.currentQuavSect = [];
		this.lastSect = 0;

		this.claviers = [];
		this.lastClavier = 0;

		this.playerLinePos = this.canvas.width / 2;
		this.playerLineColor = "blue";

		this.loopID = 0;
		this.status = "stopped";

		/*
			Desplazamiento horizontal ocasionado por el paso del tiempo.
		*/
		this.dx = 0;

		/*
			Rango de notas que se deben dibujar.
		*/
		this.firstNote = 0;
		this.lastNote = 0;

		this.timeSinceStart = 0;
		this.lastTime = 0;
	}

	start()
	{
		if(this.status != "playing")
		{
			this.status = "playing";
			this.lastTime = performance.now();
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
	{
		this.lastTime = 0;
		this.timeSinceStart = 0;
	}

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
			time: 0,
			x: this.playerLinePos,
			clavier: "g",

			/*
				Propiedades que definen las secciones de corcheas, semicorcheas, fusas y semifusas.
				Estas secciones se deberán dibujar de una forma especial.
			*/
			quaverSection: false,
			quaverTotalDuration: 0,
			quaverSectionElements: []
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
		this.checkNoteVisualization();
		this.checkNoteLine();
		this.checkQuaverSection();
		this.draw();
	}

	mainLoop()
	{
		this.update();
		this.draw();
	}

	/*
		Controla el rango de notas que deben de ser dibujadas en el frame actual.
		Esto lo hace verificando las notas que se escapan y entran en la pantalla.
	*/
	checkNoteVisualization()
	{
		while(this.lastNote < this.visualNotes.length && this.visualNotes[this.lastNote].x - this.dx < this.canvas.width)
		{
			this.lastNote += 1;
		}

		if(this.firstNote < this.lastNote && this.visualNotes[this.firstNote].x - this.dx < -10)
		{
			this.firstNote += 1;
			if(this.noteFirst == this.visualNotes.length)
			{
				this.stop();
			}
		}
	}

	/*
		Verifica si se debe cambiar de clave en el frame actual.
	*/
	checkClavier()
	{
		if(this.lastClavier < this.claviers.length - 1 && this.claviers[this.lastClavier + 1].time < this.timeSinceStart)
		{
			this.lastClavier += 1;
		}
	}

	checkNoteLine()
	{
		while(this.lastLine < this.noteLines.length && this.noteLines[this.lastLine].x - this.dx < this.canvas.width)
		{
			this.lastLine += 1;
		}

		if(this.firstLine < this.lastLine && this.noteLines[this.firstLine].x - this.dx < -10)
		{
			this.firstLine += 1;
		}
	}

	checkQuaverSection()
	{
		var lastSect = this.lastSect;
		for(var i = lastSect; i < this.quaverSections.length && i < lastSect + 4; ++i)
		{
			if(this.quaverSections[i].x - this.dx < this.canvas.width)
			{
				this.currentQuavSect.push(this.quaverSections[i]);
				this.lastSect += 1;
			}
			else break;
		}

		var toDelete = 0;
		for(var i = 0; i < this.currentQuavSect.length && i < 4; ++i)
		{
			if(this.currentQuavSect[i].toX - this.dx < -10)
			{
				toDelete += 1;
			}
			else break;
		}
		this.currentQuavSect.splice(0, toDelete);
	}

	update()
	{
		const currentTime = performance.now();
		const deltaTime = currentTime - this.lastTime;
		this.lastTime = currentTime;

		this.checkNoteVisualization();
		this.checkClavier();
		this.checkNoteLine();
		this.checkQuaverSection();

		const dx = this.velocity * deltaTime / 1000;
		this.dx += dx;
		this.context.translate(-dx, 0);

		this.timeSinceStart += deltaTime;
	}

	draw()
	{
		this.context.save();
		this.context.setTransform();

		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.drawScoreLines(this.context, this.canvas.width);

		this.context.restore();

		this.drawNotes(this.context);
		this.drawNoteLines(this.context);
		this.drawQuaverSections(this.context);

		this.context.save();
		this.context.setTransform();

		this.drawPlayerLine(this.context);
		this.drawClavier(this.context);

		this.context.restore();
	}
	
	drawScoreLines(context, width)
	{
		for(var i = 0; i < 5; ++i)
		{
			context.beginPath();
			context.moveTo(0, this.canvasPadding + i * 7 + 0.5);
			context.lineTo(width, this.canvasPadding + i * 7 + 0.5);
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
		for(var i = this.firstNote; i < this.lastNote; ++i)
		{
			this.visualNotes[i].draw(context);
		}
	}

	drawNoteLines(context)
	{
		for(var i = this.firstLine; i < this.lastLine; ++i)
		{
			this.noteLines[i].draw(context);
		}
	}

	drawQuaverSections(context)
	{
		for(var i = 0; i < this.currentQuavSect.length; ++i)
		{
			this.currentQuavSect[i].draw(context);
		}
	}

	drawClavier(context)
	{
		const clavier = this.claviers[this.lastClavier].clavier;

		context.fillStyle = "white";
		context.fillRect(0, 0, 52, this.canvas.height);

		this.drawScoreLines(context, 52);

		context.drawImage(this.imgs[clavier + "_clavier"][0], 15, 10);
	}

	registerNote(note)
	{
		var vn = this.createVisualNotes(note);

		var changedClavier = false;

		if(this.claviers.length == 0)
		{
			this.claviers.push({
				clavier: this.gen.clavier,
				time: 0
			});
		}
		else if(this.claviers[this.claviers.length - 1].clavier != this.gen.clavier)
		{
			this.claviers.push({
				clavier: this.gen.clavier,
				time: this.gen.time
			});

			changedClavier = true;
		}

		for(var i = 0; i < vn.length; ++i)
		{
			var visualNote = vn[i];

			this.noteTime.push(this.gen.time);
			this.gen.time += visualNote.duration * 1000;

			visualNote.x = this.gen.x;

			this.gen.x += visualNote.duration * this.velocity;

			this.visualNotes.push(visualNote);

			var timeFactor = 120 / this.gen.currentTempo;

			/*
				Verificar si está activa una sección de corcheas.
			*/
			if(this.gen.quaverSection)
			{
				/*
					Si la duración de la nota actual supera la duración de una corchea.
				*/
				if(visualNote.duration > this.noteDuration[3] * timeFactor)
				{
					this.createQuaverSection();

					this.gen.quaverSection = false;
					this.gen.quaverTotalDuration = 0;
					this.gen.quaverSectionElements = [];

					continue;
				}

				this.gen.quaverTotalDuration += visualNote.duration;

				if(changedClavier || this.gen.quaverTotalDuration > 1 * timeFactor)
				{
					this.createQuaverSection();

					this.gen.quaverSection = false;
					this.gen.quaverTotalDuration = 0;
					this.gen.quaverSectionElements = [];
				}
				else
				{
					this.gen.quaverSectionElements.push(visualNote);
				}
			}

			if(!this.gen.quaverSection && visualNote.duration <= this.noteDuration[3] * timeFactor)
			{
				this.gen.quaverSection = true;
				this.gen.quaverTotalDuration += visualNote.duration;
				this.gen.quaverSectionElements.push(visualNote);
			}
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
		if(noteID < 12 * 3) clavier = "f";
		else clavier = "g";

		this.gen.clavier = clavier;

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

	createQuaverSection()
	{
		if(this.gen.quaverSectionElements.length <= 1)
		{
			return;
		}

		var timeFactor = 120 / this.gen.currentTempo;

		var majorVerticalPos = -100;
		var minorVerticalPos = 100;
		var majorID = 0;
		var minorID = 0;

		for(var i = 0; i < this.gen.quaverSectionElements.length; ++i)
		{
			var visualNote = this.gen.quaverSectionElements[i];

			if(visualNote.verticalPos > majorVerticalPos)
			{
				majorVerticalPos = visualNote.verticalPos;
				majorID = i;
			}
			if(visualNote.verticalPos < minorVerticalPos)
			{
				minorVerticalPos = visualNote.verticalPos;
				minorID = i;
			}

			visualNote.changeSymbol(this.noteSymbols[7][0], this.scoreDimensions);
		}

		var majorDV = 0;
		var minorDV = 0;

		if(majorVerticalPos > 3)
		{
			majorDV = majorVerticalPos - 4;
		}
		else
		{
			majorDV = 4 - majorVerticalPos;
		}

		if(minorVerticalPos > 3)
		{
			minorDV = minorVerticalPos - 4;
		}
		else
		{
			minorDV = 4 - minorVerticalPos;
		}

		var sectionDirection = "up";
		if(majorVerticalPos > 3 && majorDV >= minorDV)
		{
			sectionDirection = "down";
		}

		var l = this.gen.quaverSectionElements.length - 1;

		var x, y, toX, toY;

		if(sectionDirection == "up")
		{
			x = this.gen.quaverSectionElements[0].x + 8.5;
			y = this.gen.quaverSectionElements[majorID].y - 18;
			toX = this.gen.quaverSectionElements[l].x + 8.5;
			toY = y;
		}
		else
		{
			x = this.gen.quaverSectionElements[0].x;
			y = this.gen.quaverSectionElements[minorID].y + 6 + 18;
			toX = this.gen.quaverSectionElements[l].x;
			toY = y;
		}

		this.quaverSections.push(new QuaverSection(x, y, toX, toY));

		for(var i = 0; i < this.gen.quaverSectionElements.length; ++i)
		{
			var visualNote = this.gen.quaverSectionElements[i];

			var lineLarge;

			if(sectionDirection == "up")
			{
				lineLarge = y - visualNote.y;

				this.noteLines.push(new NoteLine(
					visualNote.x + 8.5,
					visualNote.y,
					lineLarge
				));
			}
			else
			{
				lineLarge = visualNote.y - y;

				this.noteLines.push(new NoteLine(
					visualNote.x,
					visualNote.y,
					-lineLarge
				));
			}

			var ql = this.gen.quaverSectionElements.length;

			if(visualNote.duration == this.noteDuration[4] * timeFactor)
			{
				if(i > 0 && this.gen.quaverSectionElements[i - 1].duration == this.noteDuration[4] * timeFactor)
				{
					if(!(i + 1 < ql))
					{
						continue;
					}
					else if(this.gen.quaverSectionElements[i + 1].duration != this.noteDuration[4] * timeFactor)
					{
						continue;
					}
				}

				var sx, sy, sToX, sToY;

				if(sectionDirection == "up")
				{
					sx = visualNote.x + 8.5;
					sy = y + 4;
				}
				else
				{
					sx = visualNote.x;
					sy = y - 4;
				}

				if(i + 1 < this.gen.quaverSectionElements.length)
				{
					var nextNote = this.gen.quaverSectionElements[i + 1];

					if(nextNote.duration == this.noteDuration[4] * timeFactor)
					{
						if(sectionDirection == "up")
						{
							sToX = nextNote.x + 8.5;
							sToY = sy;
						}
						else
						{
							sToX = nextNote.x;
							sToY = sy;
						}

						this.quaverSections.push(new QuaverSection(sx, sy, sToX, sToY));
					}
					else
					{
						var dxNext = (nextNote.x - visualNote.x) / 2;

						sToX = nextNote.x + 8.5 - dxNext;
						sToY = sy;

						this.quaverSections.push(new QuaverSection(sx, sy, sToX, sToY));
					}
					
				}
				else if(i > 0)
				{
					var prevNote = this.gen.quaverSectionElements[i - 1];

					var dxPrev = (visualNote.x - prevNote.x) / 2;

					sToX = visualNote.x + 8.5 - dxPrev;
					sToY = sy;

					this.quaverSections.push(new QuaverSection(sx, sy, sToX, sToY));
				}
			}
		}
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
		case "g":
			verticalPos += -2 + (note.octave - 3) * 7;
			break;

		case "f":
			verticalPos += -4 + (note.octave - 1) * 7;
			break;
		}

		return verticalPos;
	}
};