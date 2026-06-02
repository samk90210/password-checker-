# passTrainer
## Video Demo: https://youtu.be/BYVJ6Jo0C0s

## Description of the passTrainer:
The passTrainer is a website where it helps its users make and understand what makes a good and strong password. The project has two distinctive modes the
password checker and the gamified mode. The password checker checks in real time the strength and entropy of the users pasword. It includes a checklist that updates everytime
the user completes the condition. Once all the conditions are met the user has made a strong password. The gamified mode which was inspired by The Password Game by neal AgarWal(neal.fun) 
which is a fun but challenging game which challenges the user to make a password based on 12 rules and from the 6th rule the game becomes really hard. The user has to progressively make a password
by unlocking new rules. The passTrainer was made using CSS, javsScript, and HTML. AI was used to help pick out color scheme for the app and to help implement neal.funs functions.

## How to run the passTrainer
To run the passTrainer you need to have all style.css, script.js and index.html in one file. After you can open the indexHtml file in any browswer that you would like and the app will load immediately. 

## Reasoning of why I wanted to make password checker 
Recently in my family ive seen that my dad and mom use the same password for all of their sites which is a massive security issue where if one password gets compromised all of their info can be caught 
instantly. So, I wanted to make a app for my family and the community to be able to know what a strong password and how fast a bad password can be breached. Compared to tools that only say weak or 
strong password. The passTrainer tells the user exactly what is missing from their password. Also for younger audience that might use my app there is a gamified mode so that they dont get bored. 

## index.html
The index.html file makes up the structure of the entire app using HTML tags. The HTML file is divided into two sections which are wrapped within a div with the class wrapper. 
The first section is the Password Mode card where its the password mode page and all of its tags. The second section is the gamified mode card which is the gamified mode page and all of its different 
tags. To switch between the the two sections we add and remove the hidden CSS class, then it sets the display to off. In the header section of the file it connects to style.css and loads the script.js 
file before the ending tag. Adding this was important because without this it makes sure that all the HTML elements exsists before JavsScript uses getElementById to find the element. I made a crucial 
mistake not adding this so that Javascript tried getting a HTML element that didnt exsist which caused a error. 


<img width="477" height="478" alt="Screenshot 2026-05-20 at 6 22 09 p m" src="https://github.com/user-attachments/assets/3d39e273-47aa-44ca-af9d-341c12a754c3" />


this is the error message as we can see because we didnt check if the html elements exsisted javascript now cant get the html element. 

## style.css 
the style.css file controls the visual appeal for the app using CSS properties which for example, font-family, color, background, border-radius, and padding. I was deep in though what color scheme to 
use so using AI i traversed through the multitude of color variations possible, I was between the light purple scheme and the black and pink scheme however after confronting family and friends the 
general favorite was the purple scheme which is became the final color scheme. I separated the file itno base, header, b1 which is botton 1, card, password input, progress bar, checklist grid, and rule 
cards. I had trouble changing through the 3 stages that the rule cards have which is green, red, and yellow. Using the same method for index.html i used the hidden class, display to none to change the 
color without moving and changing any of the elements on the page.


<img width="706" height="633" alt="Screenshot 2026-05-23 at 8 17 21 p m" src="https://github.com/user-attachments/assets/adc21b87-f17b-46de-a634-790da1e7c042" />


This is purple scheme were every thing is visible and appealing to the eye 


<img width="483" height="602" alt="Screenshot 2026-05-23 at 8 16 53 p m" src="https://github.com/user-attachments/assets/ccaf479b-00de-40e0-b722-c2eba8c592d0" />


This is the pink and black theme were it is also very appealing and pleasant to the eye however the gamified and password mode is really hard to read and when I was making this app I watned it to be 
colorful and something that isnt dark. So, after a lot contemplating I choose the purple theme. 

## script.js 
In one sentence the script.js is all the application logic where it controls all the functions of the app and without doubt is hardest part to write in the entire project. I had trouble writing the 
entropy calculation. I wanted to add entropy to my app because I though it was a cool idea of being able to know how many bits of entropy can be in a password. There was one problem, I didnt know how 
to calculate entropy which I found out which is bits = length x log2(pool size). I figured that pool size is the number of possible characters that can go into one letter of the password. I didnt know 
that entropy could be calculated and that how the bits grow exponentially. Another part of the code which I contemplated is the renderRules function where it I either show every rule at once or make my 
self a challenge by showing the next rule after all the requirements are met in the input that the user makes. I like my self a challenge so I decided to challenge so I used the createElement and 
appendChild and then check if all the rules are passing. If they are show a new rule. As well a problem that i had is when switching between the password and gamfied mode everytime I switch back to the 
gamified mode the gamfied mode reset and made it tough for the user because he they had to retype the password everytime. However, this issue was fixed using the gameStart which is boolean which stays 
true if the user made a input in the gamified mode which ultimately avoids the game resseting everytime the user switches modes. 
