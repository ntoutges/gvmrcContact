const $ = document.querySelector.bind(document);

const API_URL = "https://pcv49zgqk3.execute-api.us-east-1.amazonaws.com/default/mailer";

function init(rootId) {
  const Block = Quill.import("blots/block");
  Block.tagName = "DIV";
  Quill.register(Block, true);

  const quill = new Quill($(`#${rootId} .contact-contents-text`), {
    modules: {
      toolbar: [
        [{ header: [1, 2, false] }],
        ['bold', 'italic', 'underline']
      ],
    },
    placeholder: 'What do you want to tell us?',
    theme: 'snow'
  })

  $(`#${rootId} .contact-other-senders`).addEventListener("click", () => {
    const email = $(`#${rootId} .contact-response-addresses`).value.trim();
    const phone = $(`#${rootId} .contact-response-numbers`).value.trim();
    const name = $(`#${rootId} .contact-response-names`).value.trim();

    const subject = $(`#${rootId} .contact-subject-texts`).value.trim();
    const content = quill.root.innerHTML;
    const hasContent = quill.root.textContent.trim().length > 0;

    const topic = $(`#${rootId} .contact-others > .contact-other-topic-container > .contact-other-topics.selected`)?.innerHTML ?? null;

    const warningEl = $(`#${rootId} .contact-contents-warnings`);

    // no contact info given
    if (email.length == 0 && phone.length == 0) {
      warningEl.innerText = "Please enter in either your email address or phone number so we can respond to you.";
      return;
    }

    // no subject
    if (!subject.length) {
      warningEl.innerText = "Please enter in a subject.";
      return;
    }

    // no content
    if (!hasContent) {
      warningEl.innerText = "Please type your message in the box above.";
      return;
    }

    $(`#${rootId} .contact-other-senders > .contact-center-align`).innerText = "Sending...";
    getReq(API_URL, {
      email,
      phone,
      name,
      subject,
      content,
      topic
    }).catch(() => { }).finally(() => { // due to "no-cors" mode, any response is hidden (annoyingly), so program cannot act on this
      $(`#${rootId} .contact-other-senders > .contact-center-align`).innerText = "Success!"; // sadly, no actually way to check for success due to CORS
      setTimeout(() => {
        $(`#${rootId} .contact-other-senders > .contact-center-align`).innerText = "Send!";
      }, 2000);
    });
  });

  const topicElements = $(`#${rootId} .contact-others > .contact-other-topic-container`).children;
  for (const child of topicElements) {
    child.addEventListener("click", selectTopic)
  }

  function selectTopic() {
    this.parentNode.querySelector(".selected")?.classList.remove("selected"); // unselect previous
    this.classList.add("selected"); // select current
  }
  if (topicElements.length > 0) selectTopic.call(topicElements[0]);
}

init("gvmrc-contact");

export function getReq(path, data = {}) {
  const queryStrings = [];
  for (let key in data) {
    queryStrings.push(`${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`);
  }
  const queryString = queryStrings.join("&");
  return new Promise((res, rej) => {
    fetch((queryString.length == 0) ? path : (path + "?" + queryString), {
      method: "GET",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json"
      }
    }).then((response) => {
      response.text().then((data) => {
        if (response.status >= 200 && response.status < 300) { // success band
          try {
            res(JSON.parse(data));
          } // attempt to convert to JSON
          catch (err) {
            res(data);
          } // if conversion fails, just send raw txt
        }
        else { // failure (of some sort)
          rej(data);
        }
      }).catch(err => {
        rej(err);
      });
    }).catch(err => { rej(err); }); // not sure if this actually does anything...
  });
}