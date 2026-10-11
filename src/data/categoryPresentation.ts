type Choice = { id: string; name: string; text: string; pattern: RegExp }
type Presentation = { title: string; accent: string; subtitle: string; choices: Choice[] }

export const categoryPresentations: Record<string, Presentation> = {
  entertainment: {
    title: 'Bring everyone together.', accent: 'Make it a movie night.', subtitle: 'Big-screen moments. Sound that brings them to life.',
    choices: [
      { id: 'televisions', name: 'Televisions', text: 'Your favourite stories, on a bigger screen.', pattern: /television|\btv\b/i },
      { id: 'audio', name: 'Speakers & soundbars', text: 'Set the mood. Feel the sound.', pattern: /speaker|soundbar|audio|theatre/i },
    ],
  },
  refrigeration: {
    title: 'Fresh food.', accent: 'More possibilities.', subtitle: 'Find a place for every ingredient and every favourite.',
    choices: [
      { id: 'refrigerators', name: 'Refrigerators', text: 'Everyday freshness for your household.', pattern: /refrigerator|fridge/i },
      { id: 'freezers', name: 'Freezers', text: 'Make room for more.', pattern: /freezer/i },
    ],
  },
  laundry: {
    title: 'Less laundry time.', accent: 'More living time.', subtitle: 'Find the right washing machine for your daily routine.',
    choices: [
      { id: 'front-load', name: 'Front-load washers', text: 'A fresh start for every load.', pattern: /front[ -]?load/i },
      { id: 'top-load', name: 'Top-load & twin-tub', text: 'Simple choices for everyday washing.', pattern: /top[ -]?load|twin[ -]?tub/i },
    ],
  },
  kitchen: {
    title: 'Something delicious.', accent: 'Starts right here.', subtitle: 'Bring your everyday kitchen ideas to life.',
    choices: [
      { id: 'cooking', name: 'Cookers & burners', text: 'From quick meals to family feasts.', pattern: /cooker|burner|oven/i },
      { id: 'small-appliances', name: 'Kitchen essentials', text: 'Little helpers for your daily routine.', pattern: /microwave|fryer|blender|kettle|dispenser/i },
    ],
  },
  lighting: {
    title: 'A brighter space.', accent: 'A different feeling.', subtitle: 'Light up the everyday. Find the finish your room deserves.',
    choices: [
      { id: 'indoor', name: 'Indoor lighting', text: 'Set the mood in every room.', pattern: /indoor|ceiling|panel|bulb|pendant/i },
      { id: 'outdoor', name: 'Outdoor & decorative', text: 'Bring your spaces to life.', pattern: /outdoor|rope|decorative|flood|garden/i },
    ],
  },
  'electrical-materials': {
    title: 'Every detail matters.', accent: 'Build with confidence.', subtitle: 'Electrical essentials for your next installation or project.',
    choices: [
      { id: 'cables', name: 'Wires & cables', text: 'Start with the right materials.', pattern: /wire|cable/i },
      { id: 'fittings', name: 'Switches & fittings', text: 'The finishing touches that count.', pattern: /switch|socket|changeover|adapter|clip/i },
    ],
  },
}
