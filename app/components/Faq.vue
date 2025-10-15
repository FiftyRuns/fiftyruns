<script setup lang="ts">
import FaqSection from './molecules/FaqSection.vue'
import FaqItem from './atoms/FaqItem.vue'
</script>

<template>
    <FaqSection>
        <template #title>Fragen rund um #50runs</template>

        <FaqItem question="Was ist nochmal www.50runs.com?">
            50runs.com ist eine Plattform, die Menschen dazu inspiriert, aktiv zu bleiben, indem sie sich das Ziel
            setzen,
            mindestens 50 Läufe zu absolvieren, während sie gleichzeitig Gutes für wohltätige Zwecke tun.
        </FaqItem>

        <FaqItem question="Warum gibt es auch eine Sommer-Edition?">
            Einige Läufer*innen haben bereits wieder nach einer neuen Challenge gefragt, andere wiederum meinten, dass
            sie im
            Winter
            nicht gerne laufen … nun gilt diese Ausrede nicht mehr ;-)
        </FaqItem>

        <FaqItem question="Wie kann ich mich anmelden?">
            Die Anmeldung ist einfach! Klicke einfach ganz oben auf der Website auf die „Registrieren“-Schaltfläche und
            folge
            den
            Anweisungen, um dein Konto zu erstellen.
        </FaqItem>

        <FaqItem question="Warum kann ich noch keine Läufe eintragen?">
            Du kannst bereits jetzt jederzeit einen Text- und Bildbeitrag hinzufügen, Läufe können dann ab 15. Oktober
            eingetragen werden.
        </FaqItem>

        <FaqItem question="Wie weit oder wie lange muss ein Lauf sein?">
            Die Challenge besteht nur darin, innerhalb des Zeitraums von 15. Oktober bis 30. April 50 Läufe zu schaffen.
            Du kannst die Läufe nach deinem eigenen Tempo und Zeitplan absolvieren.
        </FaqItem>

        <FaqItem question="Kann ich selbst eine wohltätige Organisation auswählen?">
            Ja! Suche dir einen wohltätigen Zweck oder eine Organisation deiner Wahl aus. Es gibt’s so viele
            unterstützenswerte
            Projekte!
            Vielleicht kennst du eines aus deinem persönlichen Umfeld? Ansonsten findest du Ideen hier.
        </FaqItem>

        <FaqItem question="Wie erfahre ich, wie viele Läufe ich absolviert habe?">
            Nach dem Abschluss jedes Laufs kannst du ihn in deinem Profil auf unserer Website vermerken. Dort siehst du
            auch,
            wie viele Läufe du bereits erreicht hast und kannst dich mit den anderen Läufer*innen vergleichen. Das
            motiviert
            zusätzlich.
        </FaqItem>

        <FaqItem question="Gibt es Vorteile für meine Teilnahme?">
            Absolut! Neben den gesundheitlichen Vorteilen unterstützt du auch noch eine wohltätige Organisation.
        </FaqItem>

        <FaqItem question="Wie kann ich Freunde einladen, teilzunehmen?">
            Du kannst Freunde über soziale Medien, E-Mail oder persönliche Einladungen auf unsere Website einladen.
            Teile ihnen einfach den Link zur Registrierung mit.
        </FaqItem>

        <FaqItem question="Wie finde ich weitere Unterstützung?">
            Falls du weitere Fragen hast, zögere nicht, uns über das Kontaktformular auf der Website oder unter
            <a href="mailto:support@50runs.com" class="underline">support@50runs.com</a> zu erreichen. Wir stehen dir
            gerne zur
            Verfügung.
        </FaqItem>

        <FaqItem question="Wie kann ich mit meiner Läufer-Community interagieren?">
            Du kannst nicht nur deine Läufe „einchecken“, sondern auch Kommentare hinterlassen. Probier’s einfach aus!
            :-)
            Und natürlich kannst du gerne unsere Facebook- und Instagram-Kanäle nutzen! #50runs
        </FaqItem>

        <FaqItem question="Wie funktioniert die Spende? Wohin muss ich überweisen?">
            Die Spende wird nicht über unsere Website abgewickelt, bitte spende den Gesamtbetrag am Ende der 50 Runs
            direkt an die wohltätige Organisation deiner Wahl und hinterlasse einen Kommentar dazu nach deinem letzten
            Lauf :-)
            Wir werden dann die Gesamtsumme addieren und euch mitteilen, wie viel wir dieses Jahr für gute Zwecke
            gesammelt
            haben.
        </FaqItem>

        <FaqItem question="Warum soll ich mein Engagement und meine Läufe auf Social Media teilen?">
            Die Forschung hat gezeigt, dass der Einfluss von Freunden dich zu besseren Leistungen – und in unserem Fall
            zu mehr
            Läufen –
            motiviert! Nutze die Macht deiner Freunde ;-)
        </FaqItem>

        <FaqItem question="Kann ich auch nach dem 15. Oktober noch beginnen und mitmachen?">
            Ja, klar – der Winter ist lang, die 50 Läufe sind schaffbar und eine Spende ist immer willkommen.
        </FaqItem>
    </FaqSection>
</template>
