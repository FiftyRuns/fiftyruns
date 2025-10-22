<template>
  <section class="max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-4">
    <h2 class="text-3xl font-extrabold text-[var(--color-primary)] mb-8 text-center">
      <slot name="title">Häufig gestellte Fragen (FAQ)</slot>
    </h2>

    <div class="space-y-4">
      <slot />
    </div>
  </section>
</template>
