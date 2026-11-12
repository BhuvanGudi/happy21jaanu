/* ============================================================
   THE STORY — edit everything here. Nothing else needs touching.
   Media files live in /media. ORDER = the order of the lists below
   (cut a line and paste it elsewhere to reorder; delete a line to remove).

   Per item:
     file: "01-photo.jpg"            (photo or video: mp4/webm/mov)
     files: ["a.jpg","b.jpg"]        (several photos for one moment, layout "pair")
     layout: "full" | "center" | "split" | "card" | "pair"
        full   = full-screen, message overlaid      center = large, message below
        split  = photo beside message               card   = small memory, offset
        pair   = several photos together
        "frame" | "duo" | "scroll"
     message: "your words"  (optional)      date: "your date" (optional)
     flip: true   (mirror split/card sides)
     focus: "50% 30%"  (for "full": which part of the photo stays visible)
     controls: true (show video controls)
     tone: "dark" | "light" | "#hexcolor"   (optional; by default the
        surrounding colours are picked automatically from the media)
   ============================================================ */
window.STORY = {
  opening: {
    eyebrow: "Jaanu and her only cutu",                              // e.g. her name
    title:   "Come with me through our story",
    line:    "I made something for you.",
    invite:  "Begin",
    bg: "#0d1220", fg: "#f3ede4"              // opening colours
  },

  chapters: [
    {
      part: "Our memories",                   // small label at the top
      title: "",                              // chapter title (leave "" to skip the title page)
      date: "",
      text: "",                               // optional text for the chapter page
      tone: "",                               // optional colours for the chapter page
      items: [
        { files: ["01-photo.jpg", "02-photo.jpg", "03-photo.jpg"], layout: "pair", fx:"tilt", message: "my love", date: "" },
        { file: "02-photo.jpg", layout: "center", fx:"tilt", message: "", date: "" },
        { file: "03-video.mp4", layout: "full",   message: "", date: "" }
      ]
    },
    {
      part: "Our story",
      title: "", date: "", text: "", tone: "",
      items: [
        { file: "04-photo.jpg", layout: "split", message: "", date: "" },
        { file: "05-photo.jpg", layout: "card",  message: "", date: "" },
        { files: ["06-photo.jpg", "07-photo.jpg"], layout: "pair", message: "", date: "" }
      ]
    }
  ],

  birthday: {
    part: "Your birthday",
    title: "Happy birthday",
    lines: [ /* your birthday words, one line each */ ],
    file: "",                                 // the final birthday photo/video (optional)
    message: "", tone: "dark"
  }
};
