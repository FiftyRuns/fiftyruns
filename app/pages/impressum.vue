<template>
    <div class="container mx-auto px-6 py-24 max-w-3xl">
        <h1 class="text-4xl font-black text-[var(--color-primary)] mb-2">Impressum</h1>
        <p class="text-sm text-gray-500 mb-10">
            Informationspflicht laut §5 E-Commerce Gesetz, §14 Unternehmensgesetzbuch, §63 Gewerbeordnung und
            Offenlegungspflicht laut §25 Mediengesetz.
        </p>

        <section class="prose prose-gray max-w-none space-y-8">
            <div>
                <p>
                    <strong>René Voglmayr</strong><br />
                    Finkengang 5<br />
                    4048 Puchenau<br />
                    Österreich
                </p>
                <p>
                    <strong>E-Mail:</strong>
                    <a href="mailto:rene@voglmayr.com">rene@voglmayr.com</a>
                </p>
            </div>

            <div>
                <h2>EU-Streitschlichtung</h2>
                <p>
                    Gemäß Verordnung über Online-Streitbeilegung in Verbraucherangelegenheiten (ODR-Verordnung) möchten
                    wir Sie über die Online-Streitbeilegungsplattform (OS-Plattform) informieren.
                </p>
                <p>
                    Verbraucher haben die Möglichkeit, Beschwerden an die Online Streitbeilegungsplattform der
                    Europäischen Kommission unter
                    <a href="http://ec.europa.eu/odr" target="_blank" rel="noopener noreferrer">http://ec.europa.eu/odr</a>
                    zu richten. Die dafür notwendigen Kontaktdaten finden Sie oberhalb in unserem Impressum.
                </p>
                <p>
                    Wir möchten Sie jedoch darauf hinweisen, dass wir nicht bereit oder verpflichtet sind, an
                    Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
                </p>
            </div>

            <div>
                <h2>Haftung für Inhalte dieser Webseite</h2>
                <p>
                    Wir entwickeln die Inhalte dieser Webseite ständig weiter und bemühen uns korrekte und aktuelle
                    Informationen bereitzustellen. Leider können wir keine Haftung für die Korrektheit aller Inhalte auf
                    dieser Webseite übernehmen, speziell für jene die seitens Dritter bereitgestellt wurden.
                </p>
                <p>
                    Sollten Ihnen problematische oder rechtswidrige Inhalte auffallen, bitte wir Sie uns umgehend zu
                    kontaktieren, Sie finden die Kontaktdaten im Impressum.
                </p>
            </div>

            <div>
                <h2>Haftung für Links auf dieser Webseite</h2>
                <p>
                    Unsere Webseite enthält Links zu anderen Webseiten für deren Inhalt wir nicht verantwortlich sind.
                    Haftung für verlinkte Websites besteht laut § 17 ECG für uns nicht, da wir keine Kenntnis
                    rechtswidriger Tätigkeiten hatten und haben, uns solche Rechtswidrigkeiten auch bisher nicht
                    aufgefallen sind und wir Links sofort entfernen würden, wenn uns Rechtswidrigkeiten bekannt werden.
                </p>
                <p>
                    Wenn Ihnen rechtswidrige Links auf unserer Website auffallen, bitte wir Sie uns zu kontaktieren,
                    Sie finden die Kontaktdaten im Impressum.
                </p>
            </div>

            <div>
                <h2>Urheberrechtshinweis</h2>
                <p>
                    Alle Inhalte dieser Webseite (Bilder, Fotos, Texte, Videos) unterliegen dem Urheberrecht. Falls
                    notwendig, werden wir die unerlaubte Nutzung von Teilen der Inhalte unserer Seite rechtlich
                    verfolgen.
                </p>
            </div>

            <div>
                <h2>Bildernachweis</h2>
                <p>
                    Die Bilder, Fotos und Grafiken auf dieser Webseite sind urheberrechtlich geschützt.
                    Die Bilderrechte liegen bei den folgenden Fotografen und Unternehmen:
                </p>
                <ul>
                    <li>Sabine Kneidinger</li>
                    <li>René Voglmayr</li>
                </ul>
                <p class="text-sm text-gray-500 mt-4">
                    Quelle: Erstellt mit dem Datenschutz Generator von firmenwebseiten.at
                </p>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { useHead } from 'nuxt/app';

useHead({
    title: 'Impressum – #50runs',
});
</script>
