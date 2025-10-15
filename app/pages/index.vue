<template>
    <section class="relative min-h-svh">
        <!-- Hintergrundbild -->
        <div class="absolute inset-0">
            <img src="/images/LandingPage_RV.webp" alt="Läufer auf einer Straße in der Natur"
                class="h-full w-full object-cover" fetchpriority="high" />
            <div class="absolute inset-0 bg-black/40" aria-hidden="true"></div>
        </div>

        <!-- Hero-Content -->
        <div class="relative z-10 flex min-h-svh items-center">
            <div class="container mx-auto px-4">
                <div class="mx-auto max-w-3xl rounded-3xl bg-white/70 p-6 shadow backdrop-blur sm:p-10">
                    <h1
                        class="text-center text-5xl font-extrabold tracking-tight text-[#01497e] sm:text-left sm:text-6xl">
                        <span class="sr-only">50runs</span>
                        #50runs 🚀
                    </h1>

                    <p
                        class="mt-6 text-center text-xl font-medium leading-snug text-[#01497e] sm:text-left sm:text-2xl">
                        Mit einer Challenge fit werden<br class="hidden sm:block" />
                        und etwas Gutes tun.
                    </p>

                    <div class="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                        <NuxtLink to="/registrieren"
                            class="inline-flex items-center rounded-2xl bg-[#a2c92d] px-6 py-3 text-base font-semibold text-[#01497e] shadow transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#a2c92d]/50"
                            aria-label="Jetzt registrieren">
                            Jetzt registrieren
                        </NuxtLink>

                        <!-- Trennlinie in Zweitfarbe -->
                        <span class="hidden h-6 w-px bg-[#a2c92d]/60 sm:inline-block" aria-hidden="true"></span>

                        <span class="text-center text-sm font-medium text-[#01497e] sm:text-left sm:text-base">
                            Ab {{ startDate }} geht’s wieder los!
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <TextBlock width="wide" align="center" eyebrow="DIE IDEE" title="Mit jeder Einheit etwas Gutes tun"
        :divider-color="'#a2c92d'" lead="Deine Aktivität schafft Mehrwert – für dich und andere.">
        <p>
            Jede registrierte Laufeinheit trägt zu einer Spende an eine wohltätige Organisation (eine Auswahl findest du
            <a href="https://service.bmf.gv.at/service/allg/spenden/show_mast.asp#aw"
                style="text-decoration: underline;">hier</a>) Wahl bei.
            So wird dein Training zu einem Beitrag für soziale Projekte.
        </p>
        <hr />
    </TextBlock>

    <TextBlock width="wide" align="center" eyebrow="WIESO 50 LÄUFE?" title="Die Story dahinter"
        :divider-color="'#a2c92d'" lead="Aus einer spontanen Idee wurde eine Bewegung – 50 Runs.">
        <p>
            Auf einem meiner Laufausflüge im Herbst 2013 hatte ich die Idee eine bestimmte Anzahl an Läufen im Winter zu
            schaffen. Einfach um ein wenig Sport zu betreiben.
            Und irgendwie kam ich von 50 Läufen auf Fifty Shades of Grey und davon wiederum auf Fifty Runs `till May. 😉
            Wiederum bei einem Laufausflug hat mich ein Freund (Danke Stefan!) dann auf die Idee gebracht die 50 Läufe
            unter einen Charity-Stern zu stellen.
            Im {{ season }} starten die 50runs bereits zum {{ numberSeasonsWinter }}. Mal. Eine Sommer Edition gab es auch
            bereits {{ numberSeasonsSummer }} Mal!
        </p>
        <hr />
    </TextBlock>

    <TextBlock width="wide" align="center" eyebrow="BIST DU DABEI?" title="Die Grundidee hinter 50 Runs"
        :divider-color="'#a2c92d'"
        lead="Gemeinsam laufen, motivieren und Gutes tun – Schritt für Schritt zur Challenge.">
        <p>
            Von {{ startDate }} bis {{ endDate }} versuche ich die 50 Läufe zu schaffen.
            Du machst es mir nach und läufst ebenfalls mindestens 50x.
            Wie lange oder weit ist dir überlassen, aber eine gewisse Challenge sollte es schon sein!
        </p>
        <hr />
    </TextBlock>

    <TextBlock width="wide" align="center" eyebrow="💬 ECHTE STIMMEN VON 50RUNNERS"
        title="Erfolgsstories unserer Community 🌟"
        lead="Authentische Erfahrungen und echte Begeisterung aus erster Hand.">
    </TextBlock>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mx-auto max-w-7xl px-4 mb-16">
        <QuoteCard author="Philipp" role="#50runner" authorImage="/images/Phillip.webp" :constrain="false" compact>
            #50runs ist für mich eine tolle Idee. Etwas Gutes tun und dabei Körper und Geist über die Wintermonate fit
            halten. Ob ich meine 139 Runs vom Vorjahr wiederholen kann wird sich zeigen.
            Ich wünsche allen eine erfolgreiche und verletzungsfreie Zeit und würde mich freuen, wenn wir so manchen
            gemeinsamen Lauf zusammen absolvieren können. Happy Running!
        </QuoteCard>

        <QuoteCard author="Victoria" role="#50runner" authorImage="/images/Victoria.webp" :constrain="false" compact>
            Die 50 Runs verbinden einfach alles, wofür ich stehe: niemals aufhören sich zu bewegen, Läufe zu einem
            Fixpunkt mit Freunden machen, soziale Projekte unterstützen und den eigenen Körper bei jedem Wind und Wetter
            abhärten.
            Mit den anderen 50runners ein gemeinsames Ziel vor Augen zu haben motiviert mich – da gibts dann auch im
            Winter keine Ausreden.
        </QuoteCard>

        <QuoteCard author="Roland" role="#50runner" authorImage="/images/Roland.webp" :constrain="false" compact>
            #50runs bedeutet für mich Soziales mit Schönem und Gesundem zu verbinden.
            Die Zeit von Oktober bis Ende April bietet in der Natur alle Facetten, die man sich vorstellen kann.
            Da draußen zu laufen heißt für mich Batterien aufladen und Spaß mit Gleichgesinnten haben. Werde auch du ein
            #50runner – Happy Running!
        </QuoteCard>
    </div>

    <div class="container mx-auto mt-20">
        <Faq />
    </div>

</template>

<script setup lang="ts">
import TextBlock from '../components/Textblock.vue';
import QuoteCard from '../components/Quote.vue';
import Faq from '../components/Faq.vue';
import { useHead } from 'nuxt/app';

/**
 * === Einfache Anpassungen ===
 * - Datum ändern: startDate unten anpassen
 * - Farben: Primär (Schrift) #01497e, Sekundär (Trennlinien/Buttons) #a2c92d
 */

const startDate = '15. Oktober 2025';
const endDate = '30. April 2026';
const season = 'Herbst 2025';
const numberSeasonsWinter = 13;
const numberSeasonsSummer = 2;

useHead({
    title: '#50runs',
    meta: [
        {
            name: 'description',
            content:
                'Schließe dich #50runs an: Mit einer Challenge fit werden und gleichzeitig Gutes tun. Jetzt registrieren!'
        }
    ]
});
</script>
