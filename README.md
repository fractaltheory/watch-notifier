## Watch Notifier

A simple script which can be hosted on Heroku to automatically check if your
desired Apple Watch is available for pickup, and e-mail you if found.

### Requirements

* [Node](https://nodejs.org/en/) 6+ and npm 3+ (installed automatically with Node)
* a free [Heroku](https://www.heroku.com/) account
* Heroku CLI [tools](https://devcenter.heroku.com/articles/getting-started-with-nodejs#set-up)
* An e-mail account for sending the e-mail notification via SMTPS and [nodemailer](https://github.com/nodemailer/nodemailer)
* An e-mail address to receive the e-mail notifications

### Installation

* Clone the repository: `git clone git@github.com:fractaltheory/apple-notifier.git`
* Navigate into the folder you just created: `cd apple-notifier`
* Using the Heroku CLI tools, create a Heroku instance: `heroku create`
* Push the repository to your Heroku instance: `git push heroku master`

### Configuration
* Find your instance within the Heroku [Dashboard](https://dashboard.heroku.com/apps)
* Visit the "Settings" tab
* Click on the "Reveal Config Vars" button
* Enter the following variable names as the "key", and fill out their values:
  * `AN_NAME` (optional) - The name in the `from` field in the e-mail notification
  * `FROM_EMAIL` - The e-mail address nodemailer will use to send the e-mail notification
  * `AN_PASSWORD` - The password for the `FROM_EMAIL` account. I suggest using up an "application-specific password" (e.g. [GMail App Password](https://security.google.com/settings/security/apppasswords))
  * `TO_EMAIL` (optional) - The e-mail address you wish to receive the notifications; if unprovided, will default to `FROM_EMAIL`
  * `POST_CODE` - The postal or zip code that will be searched (no spaces), e.g. `V1V2N2`, `90210`
  * `AN_MODELS` - A space-delimited list of the _model numbers_ [1] you wish to search for, i.e. `MNNY2CL/A MNP02CL/A`

### Usage
* Back in the terminal, start the instance: `heroku ps:scale worker=1 web=0`
* You're done! You can check if the app has started via the logs with `heroku logs --tail`

[1] To find the model name of the Apple Watch, it's a straight-forward process if your Watch is only available as Series 2. Go to the Apple Store website and find the model of Apple Watch you want. The model name will be in the URL, e.g.

`http://www.apple.com/ca/shop/buy-watch/apple-watch/rose-gold-aluminium-light-pink-midnight-blue-woven-nylon?preSelect=false&product=MNP02CL/A&step=detail#`

The `product=MNP02CL/A` part of this query string is what we're interested in - in this case, the model number is `MNP02CL/A`.
**NOTE**: If the Apple Watch you are interested in has both Series 1 and Series 2 availability, things get trickier. Follow these steps:

* Visit the page of the Apple Watch
* Open the [Developer Tools](https://developer.chrome.com/devtools) and click on the "Network" tab
* Click on "Series 1" or "Series 2"
* You should see a series of requests being made that include the model number, e.g. `pickup-eligibility?parts.0=MNPL2CL%2FA`
* We don't want to include that `%2F` part, replace it with a `/` and use that as your model number, i.e. `MNPL2CL/A`