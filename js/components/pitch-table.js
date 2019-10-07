

Vue.component('pitch-table', {
	template: `  <div id="pitch-table">
	  <div class="slider-holder">
			<div class="label">Octaves</div>
			<vue-slider v-model="octaveRange" :piecewise="true" :interval="1" :dot-size="12" :min="-6" :max="8" :height="6" direction="horizontal" tooltip="always"></vue-slider>
		</div>

		<div class="table-holder">
			<table class="pitch-table">
				<tr v-for="note in reversedNotes" class="note-block" >

					<td is="note-cell" v-for="octave in octaves" :key="octave" :root="rootFreq" :note="note" :octave="octave" :tuning="tuning" :type="oscType"></note-cell>


				</tr>
			</table>
		</div>

	<div class="control-row">
	<div>
		<div class="label">Intonation</div>
		<div class="button-holder">
			<button :disabled="tuning=='equal'" @click="tuning='equal'">EQUAL</button>
			<button :disabled="tuning=='just'" @click="tuning='just'">JUST</button>
		</div>
	</div>
	<div>
		<div class="label">Oscillator</div>
		<div class="button-holder">
			<button v-for="type in oscTypes" :disabled="oscType==type" @click="oscType=type">{{type}}</button>
		</div>
	</div>


		<div class="slider-holder">
			<div class="label">A4, Hz</div>
			<vue-slider v-model="rootFreq" :interval="0.5" :dot-size="12" :min="400" :max="450" :height="6" direction="horizontal" tooltip="always"></vue-slider>
		</div>

	</div>




	</div>`,
  components: {
		vueSlider: window["vue-slider-component"]
	},
	data() {
    return {
      notes:Chroma.Notes,
      octaveRange:[0,6],
      frequency:1,
      oscType:'sawtooth',
      oscTypes:['sine','triangle','sawtooth','square'],
      tuning:'equal',
      sound:false,
      started:false,
      rootFreq:440,
      osc:''
	  }
  },
	computed: {
		reversedNotes() {
			let notes=[...this.notes]
			return notes.reverse();
		},
		octaves() {
			let octaves=[];
			for(i=this.octaveRange[0];i<=this.octaveRange[1];i++) {
				octaves.push(i)
			}
			return octaves
		}
	},
	methods: {

	},
	watch: {
		frequency() {
			this.osc && this.osc.frequency.setValueAtTime(this.frequency,Tone.context.currentTime)
		}
	},
	created: function(){


	}
});


// grid-cell

Vue.component('note-cell', {
	template:`
	<td	class="note-button"
				:style="{backgroundColor:note.color}"
				@click="toggle()"
				:class="{'active-tempo':active,'black-text':note.pitch==2}"
				>
		<div class="note-grid">

			<div class="begin">
				{{note.name}}<br />{{octave}}
			</div>
			<div class="note-freq">
				{{frequency}}&nbsp;Hz
			</div>
			<div class="note-freq">
				{{bpm}}&nbsp;BPM
			</div>

		</div>

	</td>
	`,
	props:['note','octave','root', 'tuning','type'],
	data() {
		return {
			active:false,
			started:false,
			justCents:[0,112,204,316,386,498,590,702,814,884,1017,1088]
		}
	},
	computed: {
		frequency() {
			return this.calcFreq(this.note.pitch, this.octave)
		},
		bpm() {
			return (this.frequency*60).toFixed(1)
		}
	},
	watch: {
		root() {
			this.refresh()
		},
		tuning() {
			this.refresh()
		},
		type(val) {
			if(this.osc) {
				this.osc.type=val;
			}
		}
	},
	methods:{
		refresh() {
			if(this.osc) {
				this.osc.frequency.setValueAtTime(this.calcFreq(this.note.pitch, this.octave),Tone.context.currentTime)
			}
		},
		toggle() {
			if(!this.active) {
				if(Tone.context.state=='suspended') {Tone.context.resume()}

					this.osc = Tone.context.createOscillator();
					this.osc.type=this.type;
					this.osc.frequency.value=this.frequency;

					this.osc.connect(this.filter);
					this.osc.start();
					this.started=true;

				this.active=true;
			} else {
				this.active=false;
				this.osc.stop();
			}
		},
		calcFreq(pitch, octave=3, root=this.root) {
			let hz=0;
			if (this.tuning=='equal') {
				hz = Number(root * Math.pow(2, octave - 4 + pitch / 12)).toFixed(2)
			}
			if(this.tuning=='just') {
				let diff = Number(Math.pow((Math.pow(2,1/1200)),this.justCents[pitch]));
				hz = Number(root*Math.pow(2,(octave-4))*diff).toFixed(2)

			}
			 return hz
		},
	},
  created() {
    this.filter= Tone.context.createBiquadFilter();
    this.filter.connect(Synth.volume);

  }
})
