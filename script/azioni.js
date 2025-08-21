
/*
PLUGIN Dastian - 07 Agosto 2025 
In costruzione - basato su Script di Lugantes
Da sistemare i commenti e l'impaginazione per rendere il file leggibile


*/

function carica_plugin() {	 


		var scelte = 
					"<div class='scelta' id='scelta_1'></div>"+
					/*"<div class='scelta' id='scelta_2'></div>"+*/
					"<div class='scelta' id='scelta_3'></div>"+
					"<div class='scelta' id='scelta_4'></div>"+
					"<div class='scelta' id='scelta_5'></div>"+
					"<div class='scelta' id='scelta_6'></div>"+
					"<div class='scelta' id='scelta_7'></div>"; 
					
		var contcomandi = 
					"<div class=''></div>"+
					"<div class='comando' id='salva_chat' title='Salva Chat'><i class='fa fa-download'></i></div>"+
					"<div class='comando' id='aprisimboli' title='Apri i simboli'><i class='fa fa-star'></i></div>"+ 
					"<div class='comando' id='lente' title='Vedi la descrizione del luogo'><img src='http://www.extremelot.eu/proc/img/_descr.gif' /></div>"+  
					"<div class='comando' id='dovegioco' title='Dove vuoi giocare oggi?'><i class='fa fa-hourglass'></i></div>"+
					"<div class='comando' id='apriazioncine' title='Apri Azioni'><i class='fa fa-diamond'></i></div>"+
					          //"<div class='comando' id='mapparapida' title='Mappa Rapida'><i class='fa fa-map-signs'></i></div>"+
					"<div class='comando' id='miascheda' title='Apri Scheda'><i class='fa fa-id-badge'></i></div>"+
					"<div class='comando' id='scelto_forum' title='Apri Bacheche'><i class='fa fa-clipboard'></i></div>"+
					"<div class='comando' id='apri_online' title='Elenco online'><i class='fa fa-users'></i></div>"+ 
					"<div class='comando' id='leggiposta' title='Posta'><i class='fa fa-envelope'></i></div>"+
					"<div class='comando' id='regole' title='Apri il regolamento'><i class='fa fa-book'></i></div>"+
					"<div class='comando' id='scriviposta' title='Scrivi Missiva'><i class='fa fa-pencil'></i></div>"+
                    //"<div class='comando' id='cartografia' title='Cartografia di Lot'><i class='fa fa-image'></i></div>"+
					"<div class='comando' id='banca' title='Banca di Lot'><i class='fa fa-money'></i></div>"+
					"<div class='comando' id='apri_editor' title='Campo testo per azioni'><i class='fa fa-commenting'></i></div>"+
          "<div class='comando' id='gest_Chat' title='Gestionale'><i class='fa fa-map'></i></div>";
		


	var sceltine = scelte;
	var n = 0; 
	$('frameset').each(function(){  n++; if(n==1){ $(this).attr('id','miodivvino'+n); }  $(this).attr('myid','miodivvino'+n); });
	$('frame').each(function(){  n++;  $(this).attr('myid','mioframmino'+n); });
    $('#miodivvino1').wrap(document.createElement("body"));




  $(`<div id="menu-container" style="
      position: fixed;
      top: 2px;
      right: 5px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
  ">
      <div id="hamburger" style="
          cursor: pointer;
          padding: 6px 10px;
          font-size: 22px;
          background: rgba(255,255,255,0.85);
          color: #222;
          max-height: 30px;
          overflow-y: auto;
          border: 1px solid #ccc;
          border-radius: 4px;
          box-shadow: 0 0 3px rgba(0,0,0,0.2);
          display: none;
      ">☰</div>
      <div id="altroframeperaltraroba" style="
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          margin-top: 4px;
          max-height: 30px;
          overflow-y: auto;
          background: rgba(255,255,255,0.9);
          border-radius: 4px;
          border: 1px solid #ccc;
          box-shadow: 0 0 3px rgba(0,0,0,0.1);
      "></div>
  </div>`).appendTo('body');


	$("<div id='lamiamappa'></div>").appendTo('body');
	
	//$('#altroframeperaltraroba').load('https://extremeplug.altervista.org/docs/plugin/tasti_fato.php');
	$('#altroframeperaltraroba').html(contcomandi);


	$('<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css">').appendTo('head');
	setTimeout(caricapaci,1000);

	 $(window).on('click','input',function( event ) { event.preventDefault();alert('clicco');  });

   // Nasconde o mostra il menu se schermo piccolo
function aggiornaMenuResponsive() {
    if (window.innerWidth < 1000) {
        $('#altroframeperaltraroba').hide();
        $('#hamburger').show();
    } else {
        $('#altroframeperaltraroba').show();
        $('#hamburger').hide();
    }
}

$('#hamburger').on('click', function() {
    $('#altroframeperaltraroba').slideToggle();
});

aggiornaMenuResponsive();
$(window).on('resize', aggiornaMenuResponsive);

	 
}

function apriazioncine() { finestra('azioniFinestra','Azioni nel luogo','https://extremeplug.altervista.org/docs/plugin/altri.php?link=https://www.extremelot.eu/proc/azioni_21.asp','width=950,height=550');  }

function caricapaci() { 
var myinfo = $("body", $("frame[name='logo']")[0].contentDocument);
var mydati = myinfo.html();
var myframeinfo = "<div id='datidelpg' style='display:hidden;'>"+mydati+"</div>";
$(myframeinfo).appendTo('body');

var nome = $("#datidelpg input[name='player']").val();

$(document)
//inserito da me 
.on('click','#cartografia',function(e) { finestra('Cartografia','Cartografia Lot','https://extremeplug.altervista.org/docs/plugin/altri.php?link=http://cartografiaextremelot.altervista.org/index.html','width=90%,height=550'); 
// ----chiusura dialog mappe
$(document).ready(function() {
         var dialogOptions = {
        autoOpen: false
      };
      $("#dlg-Cartografia").dialog(dialogOptions);

      $("#cartografia").click(function() {
        if(!$("#dlg-Cartografia").dialog("isOpen")) {
          $("#dlg-Cartografia").dialog("open");
        } else {
          $("#dlg-Cartografia").dialog("close");
        }
      });

      }); 
})
// Banca
.on('click','#banca',function(e) { finestra('Banca','Banca di Lot','https://extremeplug.altervista.org/docs/plugin/altri.php?link=https://www.extremelot.eu/lotnew/banca_d.asp','width=90%,height=550'); 

// ----chiusura dialog mappe
$(document).ready(function() {
         var dialogOptions = {
        autoOpen: false
      };
      $("#dlg-Cartografia").dialog(dialogOptions);

      $("#cartografia").click(function() {
        if(!$("#dlg-Cartografia").dialog("isOpen")) {
          $("#dlg-Cartografia").dialog("open");
        } else {
          $("#dlg-Cartografia").dialog("close");
        }
      });

      }); 
})

/*MISSIVA*/
.on('click','#scriviposta, [myid="scriviposta"]',function(e) { scriviposta(); 


// ----chiusura dialog missiva
$(document).ready(function() {
         var dialogOptions = {
        autoOpen: false
      };
      $("#dlg-postalot").dialog(dialogOptions);

      $("#scriviposta").click(function() {
        if(!$("#dlg-postalot").dialog("isOpen")) {
          $("#dlg-postalot").dialog("open");
        } else {
          $("#dlg-postalot").dialog("close");
        }
      });

      }); 
})

//----->

.on('click','#apriazioncine',function(e) { apriazioncine();  })
.on('click','#apri_online,[myid="vedionline"],#scelta_4',function(e) { var url = "https://www.extremelot.eu/proc/collegati.asp"; finestra('vediOnline','Personaggi Online ',url,'width=950,height=550'); })
.on('click','#apri_editor',function(e) { editorino(); })
.on('click','#scelto_forum',function(e) { var idforum = $('#imieiforumx').val(); bacheca(idforum); })
.on('click','#salva_chat',function(e) {  salviamo(); })
.on('click','#listaluoghirapidi p',function(e) { var idluogo= $(this).attr('vai'); spostati(idluogo); })
.on('click','#scelto_posto',function(e) { var idluogo= $('#vaiverso').val(); spostati(idluogo); })
.on('click','#dovegioco',function(e) { finestra('doveGioco','Dove vuoi giocare?','https://extremeplug.altervista.org/docs/plugin/altri.php?link=https://www.extremelot.eu/proc/chiedove.asp','width=950,height=550'); })
.on('click','#mapparapida',function(e) { finestra('mapparapida','Mappa Rapida','https://extremeplug.altervista.org/docs/plugin/mapparapida.php','width=700,height=500'); })
.on('click','#aprisimboli, #scelta_5',function(e) { finestra('simboliLot','Simboli e statuti','https://www.extremelot.eu/lotnew/simboli.asp','width=950,height=550'); })
.on('click','[aprizona]',function(e) { var id = 1; id = $(this).attr('aprizona'); $('#dlg-mapparapida #lista_loc_mappina').load('https://extremeplug.altervista.org/docs/plugin/mapparapida.php?IDZona='+id,'width=950,height=550'); })
.on('click','#lente',function(e) { 	var controllacisia =  $("frame[name='testo']").length; var framealtro = $('body', $("frame[name='testo']", $("frame[name='result']")[0].contentDocument)[0].contentDocument);	
if (framealtro) { finestra('descLuogo','Descrizione del luogo in cui ti trovi','https://extremeplug.altervista.org/docs/plugin/altri.php?link=https://www.extremelot.eu/proc/vedi_desc_21.asp','width=950,height=550'); }  
})
.on('click','#scelta_2',function(e) { top.logo.document.valore.lot.value; } )
.on('click','#miascheda',function(e) { vedischeda(); } )
.on('click','#scelta_7',function(e) { apriazioncine(); })
.on('click','#gest_Chat',function(e) { apriGestionale(); } )

.on('click','#regole, #scelta_6',function(e) { finestra('regoleLot','Regolamenti','https://extremeplug.altervista.org/docs/plugin/altri.php?link=https://www.extremelot.eu/lotnew/leggi/leggi.asp','width=950,height=550'); 

//----->chiusura dialog regole

$(document).ready(function() {
         var dialogOptions = {
        autoOpen: false
      };
      $("#dlg-regoleLot").dialog(dialogOptions);

      $("#regole").click(function() {
        if(!$("#dlg-regoleLott").dialog("isOpen")) {
          $("#dlg-regoleLot").dialog("open");
        } else {
          $("#dlg-regoleLot").dialog("close");
        }
      });

      });   
})
.on('click','#leggiposta, [myid="leggiposta"], #scelta_1',function(e) { leggiposta(); })
.on('click','#dlg-vediOnline a[href^="collegati"]',function(e) { e.preventDefault(); var pagina = $(this).attr('href'); $('#dlg-vediOnline').load('https://www.extremelot.eu/proc/'+pagina); })
.on('click','#dlg-simboliLot a[href^="simboli.asp"]',function(e){ e.preventDefault(); var pagina = $(this).attr('href'); $('#dlg-simboliLot').load(pagina); })
.on('click','#dlg-simboliLot a[href^="vedistatuto.asp"]',function(e){ e.preventDefault(); var pagina = $(this).attr('href'); finestra('statuTo','Statuto','https://extremeplug.altervista.org/docs/plugin/altri.php?link='+pagina,'width=950,height=550'); })
.on('click','#dlg-vediOnline a[href^="#"]',function(e) { e.preventDefault();  })
.on('submit','#dlg-vediOnline form[action="collegati.asp?pos=gilda"]',function(e) {  e.preventDefault(); 
var modulo = 'form[action="collegati.asp?pos=gilda"]';
var nomeprova = $(modulo).attr('action');
var nomelink = 'https://www.extremelot.eu/proc/'+nomeprova; 
var esito = "#dlg-vediOnline";
$.post( nomelink, $(modulo).serialize()).done(function(data) { $(esito).html(data); } ); 
})
.on('submit','#dlg-vediOnline form[action="collegati.asp?pos=clans"]',function(e) {  e.preventDefault(); 
var modulo = 'form[action="collegati.asp?pos=clans"]';
var nomeprova = $(modulo).attr('action');
var nomelink = 'https://www.extremelot.eu/proc/'+nomeprova; 
var esito = "#dlg-vediOnline";
$.post( nomelink, $(modulo).serialize()).done(function(data) { $(esito).html(data); } ); 
})
.on('submit','#dlg-vediOnline form[action="collegati.asp?pos=area"]',function(e) {  e.preventDefault(); 
var modulo = 'form[action="collegati.asp?pos=area"]';
var nomeprova = $(modulo).attr('action');
var nomelink = 'https://www.extremelot.eu/proc/'+nomeprova; 
var esito = "#dlg-vediOnline";
$.post( nomelink, $(modulo).serialize()).done(function(data) { $(esito).html(data); } ); 
})
.on('submit','#dlg-vediOnline form[action="collegati.asp?pos=razze"]',function(e) {  e.preventDefault(); 
var modulo = 'form[action="collegati.asp?pos=razze"]';
var nomeprova = $(modulo).attr('action');
var nomelink = 'https://www.extremelot.eu/proc/'+nomeprova; 
var esito = "#dlg-vediOnline";
$.post( nomelink, $(modulo).serialize()).done(function(data) { $(esito).html(data); } ); 
})
.on('submit','#dlg-vediOnline form[action="chiedove.asp"]',function(e) {  e.preventDefault(); 
finestra('doveGioco','Dove vuoi giocare?','https://extremeplug.altervista.org/docs/plugin/altri.php?link=https://www.extremelot.eu/proc/chiedove.asp','width=950,height=550'); 
})
.on('click','#dlg-vediOnline a[href^="javascript:dettagli"], #dlg-simboliLot  a[href^="javascript:dettagli"]',function(e) { e.preventDefault(); var pagina = $(this).attr('href'); pagina = 
pagina.replace("javascript:dettagli('", ""); pagina = pagina.replace("');", ""); vedischeda(''+pagina+''); })

.on('click','#dlg-vediOnline a[href^="javascript:posta"], #dlg-simboliLot  a[href^="javascript:posta"]',function(e) { e.preventDefault(); var pagina = $(this).attr('href'); pagina = 
pagina.replace("javascript:posta('", ""); pagina = pagina.replace("');", ""); scriviposta(''+pagina+''); })

;

} 
/************************************************/
/* ZONA POSTALOT                                */
/*************************************************/

/* ----> scriviamo veloci un postalot*/
function scriviposta(nome) {if (!nome) { var nome = ''; } else { var nome = '?ID='+nome; } finestra('postalot','Piccione','https://extremeplug.altervista.org/docs/plugin/altri.php?link=https://www.extremelot.eu/proc/posta/_scrivialtri.asp'+nome,'width=15%,height=250'); 

//------------ verifichiamo che il dialog sia aperto e non apriamone un secondo --------//

$(document).ready(function() {
         var dialogOptions = {
        autoOpen: false
      };
      $("#dlg-postalot").dialog(dialogOptions);

      $("#scriviposta").click(function() {
        if(!$("#dlg-postalot").dialog("isOpen")) {
          $("#dlg-postalot").dialog("open");
        } else {
          $("#dlg-postalot").dialog("close");
        }
      });

      });   
//-----------------------
}


function leggiposta() { finestra('postaLot','Posta','https://extremeplug.altervista.org/docs/plugin/altri.php?link=https://www.extremelot.eu/proc/posta/leggilaposta.asp','width=900,height=550'); 
$(document).ready(function() {
         var dialogOptions = {
        autoOpen: false
      };
      $("#dlg-postaLot").dialog(dialogOptions);

      $("#leggiposta").click(function() {
        if(!$("#dlg-postaLot").dialog("isOpen")) {
          $("#dlg-postaLot").dialog("open");
        } else {
          $("#dlg-postaLot").dialog("close");
        }
      });

      });   
}

/************************************************/
/*              ZONA salvataggio chat                   */
/************************************************/

/*-----salviamo la nostra giocata---*/
function salviamo() {
	
$('#imieidati').remove();
$('#miachattina').remove();
$('#linksalva').remove();

var framechat = $('body', $("frame[name='testo']", $("frame[name='result']")[0].contentDocument)[0].contentDocument);
var frameinfo = $("body", $("frame[name='logo']")[0].contentDocument);
var dati = frameinfo.html();
var salvadati = "<div id='imieidati' style='display:hidden;'>"+dati+"</div>";
$(salvadati).appendTo('body');

var nome = $("#imieidati input[name='player']").val();
var luogo = $("#imieidati input[name='titolo']").val();
luogo = luogo.replace("<b>", "").replace("</b>", "");
if (framechat) {
var info = framechat.html();
info = info.replace(/\&gt;/g, "»</i>")
            .replace(/\&lt;/g,'<i>«');


var salvachat = "<div id='miachattina' style='display: none';><form id='salvataggio' name='salvataggio'><input type='hidden' name='pg' id='pg' value='"+nome+"' /><input type='hidden' name='luogo' id='luogo' value=\""+luogo+"\" /><textarea id='chat' name='chat'>"+info+"</textarea></form><div id='esito_salva'></div></div>";

$(salvachat).appendTo('body');

var url = "https://extremeplug.altervista.org/docs/plugin/salva_chat3.php";
var modulo = "#salvataggio"; 
var esito = "#esito_salva";
$.post( url, $(modulo).serialize()).done(function(data) { $(esito).html(data); } );

//apriamo dialog
$('#esito_salva').dialog({ title:'Chat Salvata', resizable: true, position: {  my: "center top",
  at: "center top", of: window }, 
		minHeight: 100,	minWidth: 200,  height: 150, width:300, cache: false,
		open: function (event,ui) {ccc() },
		close: function(event, ui) { $(this).dialog("close"); $(this).remove(); } });
 // Setto il tempo massimo di apertura del dialog a 10 secondi
      setTimeout(function(){
        $("#esito_salva").remove();
     }, 4000);

} 
}

function salvamessaggi() {
	
var framemex = $('body', $("frame[name='mioframe']", $("frame[name='result']")[0].contentDocument)[0].contentDocument);
var dati = framemex.html();

}

/************************************************/
/* editor 2000 caratteri                        */
/*************************************************/


function ccc() { $('#mioeditorino').on({
    keyup: function() { contacara(); },
    blur:  function() { contacara(); },
    focus: function() { contacara(); }
}) }


function editorino() { 
if ( $("#divinfinestra").length ) { $("#divinfinestra").remove(); }  
var inteditorino = "<div id='divinfinestra'><div class='intedit'><textarea id='mioeditorino' placeholder='Scrivi la tua azione'maxlength='2000'></textarea><button id='button'>Copia</button></div><div id='contacaratteri'></div></div>";
$('body').append(inteditorino);

	$('#divinfinestra').dialog({ title:'Scrivi Azione', resizable: true, position: { my: "center", 	at: "center", of: window }, 
		minHeight: 250,	minWidth: 550,  height: 300, width:600, cache: false,
		open: function (event,ui) { ccc();contacara(); },
		close: function(event, ui) { $(this).dialog("close"); $(this).remove(); } });
$('#divinfinestra').dialogExtend({
maximizable :true,//massimizzo
minimizable:true,// minimizzo
});

//bottoncino

$("button").click(function(){
    $("textarea").select();
    document.execCommand('cut');
});


//------------ verifichiamo che il dialog sia aperto e non apriamone un secondo --------
$(document).ready(function() {
         var dialogOptions = {
        autoOpen: false
      };
      $("#divinfinestra").dialog(dialogOptions);

      $("#apri_editor").click(function() {
        if(!$("#divinfinestra").dialog("isOpen")) {
          $("#divinfinestra").dialog("open");
        } else {
          $("#divinfinestra").dialog("close");
        }
      });

      });   
//-----------------------


};


/************************************************/
/* BACHECA                                        */
/*************************************************/



function bacheca(id) { 
//if ( $("#dlg-VediBacheca_b1").dialog("isOpen")) { $("#dlg-VediBacheca_b1").remove(); }  
var url = "https://www.extremelot.eu/proc/forum/forum.asp?codforum=225";
if (!id) { var id = 'b1'; } 
if (id == 'b1') { var url = "https://www.extremelot.eu/proc/forum/bacheca.asp";  var nomebacheca = "Ducale"; } 
else if (id == 'b2') { var url = "https://www.extremelot.eu/proc/forum/forumel.asp?cod=120"; var nomebacheca = "Fato";  }
else {  var nomebacheca = $('#imieiforumx option:selected').text(); var url = "https://www.extremelot.eu/proc/forum/forum.asp?codforum="+id;  }
finestra('VediBacheca_'+id,'Bacheca '+nomebacheca,'https://extremeplug.altervista.org/docs/plugin/bacheche.php?link='+url,'width=1050,height=550');

 // Setto il tempo massimo di apertura del dialog a 10 minuti
      setTimeout(function(){
        $("#dlg-VediBacheca_b1").remove();
     }, 600000);
	 
//------------ verifichiamo che il dialog sia aperto e non apriamone un secondo --------
$(document).ready(function() {
         var dialogOptions = {
        autoOpen: false
      };
      $("#dlg-VediBacheca_b1").dialog(dialogOptions);

      $("#scelto_forum").click(function() {
        if(!$("#dlg-VediBacheca_b1").dialog("isOpen")) {
          $("#dlg-VediBacheca_b1").dialog("open");
        } else {
          $("#dlg-VediBacheca_b1").dialog("close");
        }
      });

      });   
//-----------------------


} 
/************************************************/
/* SCARICA AZIONI                                */
/*************************************************/


function aziona(id) { top.result.location='../proc/azioni.asp?azione='+id; } 

/*----vediamo quanto siamo belli*/
function vedischeda() {
  // Controlla se il dialogo esiste già
  if ($("#confermaSchedaDialog").length) {
    $("#confermaSchedaDialog").remove();
  }

  // Crea il dialogo
  const dialogHtml = `
    <div id="confermaSchedaDialog" title="Vedi Scheda?">
      <p>Vuoi vedere la tua scheda?</p>
    </div>
  `;
  $('body').append(dialogHtml);

  // Costruzione dialog
  $("#confermaSchedaDialog").dialog({
    modal: true,
    buttons: {
      "Sì": function () {
        $(this).dialog("close");

        // Prende il nome del pg dal DOM
        const nome = $("#datidelpg input[name='player']").val();
        if (!nome) {
          alert("Nome PG non trovato.");
          return;
        }

        apriScheda(nome);
      },
      "No": function () {
        $(this).dialog("close");

        // Prompt per inserire il nome manualmente
        const nome = prompt("Inserisci il nome del personaggio:");
        if (!nome) return;

        apriScheda(nome);
      }
    },
    close: function () {
      $(this).remove();
    }
  });

  // Funzione per aprire la scheda
  function apriScheda(nome) {
    const pulito = nome.replace(/[^\w\-]/g, '');
    const url = "https://www.extremelot.eu/proc/schedaPG/scheda.asp?ID=" + encodeURIComponent(pulito);
    finestra('scheda_' + pulito, 'Scheda ' + pulito,
      'https://extremeplug.altervista.org/docs/plugin/altri.php?classe=scheda&link=' + url,
      'width=1000,height=600');
  }
}

function nofarniente() { } 

/************************************************/
/*  GESTORE CHAT  */
/*************************************************/
function apriGestionale() {
    $('#gestionale').remove();

    // creo il contenitore del gestionale
    let contenitore = $("<div id='gestionale'></div>").appendTo('body');

    // carico il gestionale intero dentro un iframe
    let iframe = $('<iframe>', {
        src: "https://www.extremelot.eu/proc/gestionale/dashboardGE.asp",
        width: "100%",
        height: "100%",
        frameborder: 0
    });

    contenitore.append(iframe);

    // apro il dialog
    contenitore.dialog({
        title: 'Gestionale',
        resizable: true,
        draggable: true,
        position: { my: "center top", at: "center top", of: window },
        minHeight: 400,
        minWidth: 600,
        height: 700,
        width: 1000,
        modal: false, // così non blocca la pagina sotto
        close: function(event, ui) {
            $(this).dialog("destroy").remove();
        }
    });
}


/* e dopo tanto lavoro..carichiamo sto plugin all'avvio*/
$(function(){  
	var fileName = location.href.split("/").slice(-1); 
	if (fileName == '_index2.htm') { carica_plugin(); }   
});

 