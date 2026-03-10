<template>
    <!-- Hero: Full-bleed über gesamten Viewport -->
    <section class="relative min-h-svh">
        <div class="absolute inset-0">
            <video
                autoplay muted loop playsinline
                poster="/images/LandingPage_RV.webp"
                class="h-full w-full object-cover"
                aria-hidden="true"
            >
                <source src="/videos/hero.webm" type="video/webm" />
                <source src="/videos/hero.mp4" type="video/mp4" />
            </video>
            <!-- Gradient: links unten dunkel → rechts oben transparent -->
            <div class="absolute inset-0 bg-gradient-to-tr from-black/80 via-black/50 to-black/20" aria-hidden="true"></div>
        </div>

        <div class="relative z-10 flex min-h-svh items-end pb-24 sm:items-center sm:pb-0">
            <div class="container mx-auto px-6">
                <div class="max-w-2xl">
                    <p class="mb-4 text-sm font-semibold tracking-widest text-[var(--color-accent)] uppercase">
                        Die Laufchallenge
                    </p>
                    <h1 class="text-6xl font-black tracking-tight text-white leading-none sm:text-8xl">
                        <span class="sr-only">50runs</span>
                        #50runs
                    </h1>
                    <p class="mt-6 text-xl font-medium text-white/85 leading-relaxed sm:text-2xl">
                        Mit einer Challenge fit werden<br class="hidden sm:block" />
                        und etwas Gutes tun.
                    </p>
                    <div class="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                        <NuxtLink to="/register"
                            class="inline-flex items-center rounded-2xl bg-[var(--color-accent)] px-7 py-3.5 text-base font-bold text-[var(--color-primary)] shadow-lg transition hover:brightness-110 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-accent)]/60"
                            aria-label="Jetzt registrieren">
                            Jetzt registrieren
                        </NuxtLink>
                        <span class="text-white/70 text-base font-medium">
                            Ab {{ startDate }} geht's wieder los!
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <TextBlock width="wide" align="center" eyebrow="DIE IDEE" title="Mit jeder Einheit etwas Gutes tun"
        lead="Deine Aktivität schafft Mehrwert – für dich und andere.">
        <p>
            Jede registrierte Laufeinheit trägt zu einer Spende an eine wohltätige Organisation bei.
            Wähle aus dem
            <a href="https://service.bmf.gv.at/service/allg/spenden/show_mast.asp#aw" target="_blank"
                rel="noopener noreferrer" style="text-decoration: underline;">
                offiziellen Spendenverzeichnis des österreichischen Finanzministeriums
            </a>
            eine förderungswürdige Organisation aus.
            So wird dein Training zu einem Beitrag für soziale Projekte.
        </p>
        <hr />
    </TextBlock>

    <TextDivider text="#50runs" :repeat="5" textColor="var(--color-accent)" />

    <TextBlock width="wide" align="center" eyebrow="WIESO 50 LÄUFE?" title="Die Story dahinter"
        lead="Aus einer spontanen Idee wurde eine Bewegung – 50 Runs.">
        <p>
            Auf einem meiner Laufausflüge im Herbst 2013 hatte ich die Idee eine bestimmte Anzahl an Läufen im Winter zu
            schaffen. Einfach um ein wenig Sport zu betreiben.
            Und irgendwie kam ich von 50 Läufen auf Fifty Shades of Grey und davon wiederum auf Fifty Runs till May.
            Wiederum bei einem Laufausflug hat mich ein Freund (Danke Stefan!) dann auf die Idee gebracht die 50 Läufe
            unter einen Charity-Stern zu stellen.
            Im {{ season }} starten die 50runs bereits zum {{ numberSeasonsWinter }}. Mal. Eine Sommer Edition gab es
            auch
            bereits {{ numberSeasonsSummer }} Mal!
        </p>
        <hr />
    </TextBlock>

    <TextDivider text="Mitlaufen? Auf jeden! #GemeinsamStark" :repeat="1" textColor="var(--color-primary)" />

    <TextBlock width="wide" align="center" eyebrow="BIST DU DABEI?" title="Die Grundidee hinter 50 Runs"
        lead="Gemeinsam laufen, motivieren und Gutes tun – Schritt für Schritt zur Challenge.">
        <p>
            Von {{ startDate }} bis {{ endDate }} versuche ich die 50 Läufe zu schaffen.
            Du machst es mir nach und läufst ebenfalls mindestens 50x.
            Wie lange oder weit ist dir überlassen, aber eine gewisse Challenge sollte es schon sein!
        </p>
        <hr />
    </TextBlock>

    <TextDivider text="#CommunityfeiertEs" :repeat="1" textColor="var(--color-accent)" />

    <TextBlock width="wide" align="center" eyebrow="ECHTE STIMMEN VON 50RUNNERS"
        title="Erfolgsstories unserer Community"
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
import { defineAsyncComponent } from 'vue';
import { useHead } from 'nuxt/app';

const TextBlock = defineAsyncComponent(() => import('../components/Textblock.vue'));
const QuoteCard = defineAsyncComponent(() => import('../components/Quote.vue'));
const Faq = defineAsyncComponent(() => import('../components/Faq.vue'));
const TextDivider = defineAsyncComponent(() => import('../components/atoms/TextDivider.vue'));

/**
 * === Einfache Anpassungen ===
 * - Datum ändern: startDate unten anpassen
 * - Farben: Primär (Schrift) var(--color-primary), Sekundär (Trennlinien/Buttons) var(--color-accent)
 */

const startDate = '15. Mai 2026';
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
                'Schließe dich #50runs an: Mit einer Challenge fit werden & gleichzeitig Gutes tun. Jetzt registrieren!'
        }
    ]
});
</script>
