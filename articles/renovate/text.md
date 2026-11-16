---
title: Renovate, don't repaint
deck: An AI agent isn't Jarvis. It's software that needs cables into a company's systems, and cables only go where the walls let them. T-Mobile rewired its systems before its agents went in. Deutsche Telekom has to do the same in Germany, in brick, with its people still at home.
author: Alexander Rudaev
context: Innovation Management for AI · TH Deggendorf · winter semester 2026/27
status: Draft for review, 17 November 2026
accent: renovate
hero: none
---

## The short version

On 5 October 2026 Deutsche Telekom told investors that software agents now do a large part of customer service at T-Mobile, its American subsidiary, and that it wants the same in Europe by 2030. {{R6-01 R6-03}} I wanted to know whether that can be copied.

My answer is that it can't be bought and screwed onto a company. It depends on the building underneath, and there are two buildings to look at: the company's own systems, and the country the company works in.

My father, a civil engineer, gave me the picture for both. In America 94% of new family homes have timber frames: a new cable is pulled through the hollow wall behind the board. In Germany about two in three new homes are brick or other masonry: a new cable runs in a channel cut into the wall and plastered over. A brick house is solid and built to stand. But once it needs new pipes, cables or a network, the work is heavy and slow. {{NAHB-2026 DESTATIS-2021 BAUNETZ-DIN18015}}

:::figure walls wide
The same new cable in three walls, laid where the installation rules put cables: along the top of the wall, then down beside the corner to a socket. In a timber frame it's pulled through holes in the studs. In plastered brick there are two ways. A duct can be screwed onto the surface and painted over: quick, and the wall stays as it was. That's repainting. Or a channel is cut, the cable laid and the wall plastered again: slow, and the cable is part of the wall. That's renovating.
:::

In this article the walls stand for the conditions a company works under, and the cables for the connections between its systems. American walls open fast: a firm can hire and let people go quickly, check the results afterwards, and buy its software from next door. German walls protect the people inside and are built to last, and every opening is cut, approved and plastered again. The houses are only a picture. They prove nothing about software, and I don't use them as evidence.

Inside its timber walls, T-Mobile's wiring was as tangled as anyone's, and it rewired before its agents went in. Telekom's wiring in Europe is a row of old houses, each wired differently, and Telekom says so itself. In Germany it has to do the work in brick, against three weights: know-how that doesn't reach the firms, laws that inspect before the wall is opened, and materials bought from America. And the staff stay, so the agents have to help them rather than replace them. The last section gives the order I'd do it in.

## 1. What an AI system is

When people hear "AI agent" they picture Jarvis from Iron Man: one mind that understands everything and does what it's told. What a company actually builds looks more like the equipment of a building site.

:::figure terms column
Four everyday objects for four parts of an AI system. The first is what most people picture as AI. A working system needs the other three.
:::

The language model is the handbook: it answers fluently from what it once read, and sometimes wrongly. Retrieval is the plans archive: the system looks up the company's own documents first, so the answer is only as good as the archive. An agent is the handbook given keys and a job. It reads the job, does a step, looks at what happened and decides the next step, in a loop, until the job is done or it hands over to a person. It may act, not only answer, but only where its keys fit. And the cables connect it to the billing system, the customer record and the network.

The handbook can be bought. The archive, the keys and the cables are the building, and that's where the work is.

## 2. The American result

@where United States · T-Mobile US
T-Mobile's figures, shown at Deutsche Telekom's investor day and in its filings with the American securities regulator, are the company's own and aren't audited. They're still the best public evidence of what agents do in a large customer service. {{R6-02 R6-06 R6-09}}

:::scene numbers

@caption What the two headline figures count. Of 100 contacts, the release speaks of 40 without saying whose, and T-Mobile's own slide counts 32 that start with the software. Then contacts per customer account in a year, at the two dates that are public.

@step 0
**The 40%.** Deutsche Telekom's release says AI agents at T-Mobile "handle 40 percent of customer contacts". I couldn't find that figure in T-Mobile's own material, and it matters, because this is the result Telekom holds up for Europe. {{R6-01 R6-06}}

@step 1
T-Mobile's slide gives 32%, and says what it counts: contacts from contract customers that were "served by an AI agent" in the second quarter of 2026. {{R6-06}}

@step 2
These are calls where the customer meets the software "from the beginning", in the words of T-Mobile's head of IT. How many of them the software finished isn't published. {{R6-02}}

@step 3
**The 55%.** It comes from a series T-Mobile has reported since 2021: how often an average customer account contacts customer care in a year. At the end of 2021 that was 7.0 times, about once every seven weeks. In mid-2026 it was 3.1 times, about once every four months. {{R6-06 R6-12}}

@step 4
The agent platform was announced in September 2024, almost three years into that fall. T-Mobile names other causes too: problems fixed before customers call, and customers doing things in the app. The fall belongs to the whole rewired house, not to the agents alone. {{R6-08 R6-14}}

:::

So the honest version of the American result is smaller than the headline: about a third of contacts start with software, and contacts fell by half while the house was being rewired. It's still a large change, and it's the one Telekom wants to copy.

Can Germany be measured against it? Not from outside. I put every American figure next to the nearest German one and got ten pairs, and in none of them do the two sides fully count the same thing over the same period. The full table is in the appendix. {{R6-06 R6-16 R6-03}}

## 3. Timber and brick

@where United States · T-Mobile US
**T-Mobile rewired.** Its head of IT told investors that the company had relied on "a largely outsourced, third-party workforce" working on systems owned by suppliers, and replaced it with its own engineers on its own systems. It built one system that holds what the company knows about each customer, and the agents read from it. A customer calling from a T-Mobile phone is recognised automatically, so the agent knows whose contract it may touch. The work cost money: 278 million dollars were written off on a billing system being replaced. Only then were the agents connected, and the share of chat conversations that never reached a person rose from about a quarter in mid-2024 to 78% in mid-2026. {{R6-02 R6-06 R6-09}}

@where Germany and Europe · Deutsche Telekom
**Telekom's houses are many, and each is wired differently.** In Germany Telekom already runs Frag Magenta, a chat and phone assistant, for more than 380 kinds of request. After login it can do a few things itself, such as show a bill or change bank details; otherwise it hands the customer to a member of staff with a summary. {{R6-16 R6-02}}

Across its European countries, Telekom's own slides say, customers prove who they are in 14 different ways, to be cut to three, and customer data sits in separate systems that still have to be made usable for agents. Above that list the slide states a principle: "Simplify before automating". {{R6-05}}

German firms in general say the same about their wiring. Of those that considered AI and decided against it, 45% named systems that don't fit together and 44% problems with their data. {{R7-06}}

Economists have a name for this pattern. Brynjolfsson, Rock and Syverson describe how a general-purpose technology pays off only after firms invest in things that don't show up as equipment: new processes, data, skills. While that investment runs, measured productivity first lags and only later rises. They call it the productivity J-curve. Rewiring is that investment, and an agent screwed onto old wiring skips it. {{BRS-2021}}

## 4. Repainting

Repainting is cheaper and faster than renovating, and from the street it looks the same for a while. The repainted version of the American result keeps the old wiring, puts an agent in front of the customers, and takes the saving from the people behind it, because there's nowhere else for the saving to come from.

Klarna, a Swedish payment company, tried it. In February 2024 it said its assistant did work that, by its own estimate, equalled 700 service agents. In May 2025 its chief executive said: "Really, investing in the quality of human support is the way of the future for us", and the company began hiring service staff again. {{R12-14 R12-15}}

## 5. Renovating with the people at home

T-Mobile did both: software took over many contacts, and the company paid 531 million dollars of severance. But it also gave the staff who stayed an assistant of their own, used in 74% of their conversations with customers, and where they use it the net promoter score is 12% higher. A study of 5,172 support agents found that AI help raised the cases solved per hour by 15%, and by about 30% for the least experienced. Where the effect on service staff has been measured, helping them pays. {{R6-06 R6-09 R4-29}}

In America a company can renovate and cut staff at the same time. Telekom in Germany can't. On 28 May 2026 it agreed with the union ver.di that there will be no dismissals for business reasons until 31 December 2028, for about 60,000 employees. People still leave by agreed routes: partial retirement, early retirement, severance, and civil servants retiring. From 2021 to 2025, 20,223 full-time positions went that way across Telekom in Germany, about 4,000 a year. {{R11-14 R12-01}}

:::figure exits wide
Every full-time position that left Telekom in Germany by an agreed route, 2021 to 2025. One mark is 25 positions. Severance almost doubled. Source: Deutsche Telekom, HR Factbook 2025.
:::

So the residents stay while the walls are opened, and I think that's an advantage, not only a constraint: it's also the route with the best evidence behind it. The residents aren't against the work. In two surveys that asked both countries the same questions, Germans were no more wary of AI than Americans. One German result stands out: 79% saw digital monitoring of workers negatively, the second-highest share in the European Union. That's the worry any German rollout has to answer first. {{R12-25 R12-28}}

:::figure attitudes column
Three questions, each asked the same way in both countries or across the EU. Sources: Ipsos for Google 2025; Ipsos AI Monitor 2025; Eurobarometer 2024 (EU only).
:::

## 6. Know-how

The first German weight is know-how: tradespeople who can do the work. German firms that had considered AI and decided against it were asked why. The first answer wasn't the law. It was missing knowledge. {{R7-06}}

:::figure obstacles column
Reasons German firms gave in 2025 for not using AI after considering it. Several answers were possible; the six most named are shown. Source: Federal Statistical Office.
:::

Germany trains AI researchers at scale, but that knowledge doesn't reach the firms that would have to rebuild. A survey by the European Investment Bank asked firms on both sides the same questions: about as many European as American firms use AI somewhere, 68% against 72%, but fewer use it in two or more parts of the business, 44% against 58%, and fewer in customer service, 22% against 29%. {{R10-01}}

Cohen and Levinthal called the missing piece absorptive capacity: a firm can only take in outside knowledge if it already has related knowledge inside. A firm without its own people who understand the wiring can buy the handbook, but it can't install it. That's why I'd train the staff before the tools arrive, not after. {{CL-1990}}

## 7. The law

Houses aren't the best picture for the law, because both countries inspect a building before anyone moves in. Cars are closer. In America no authority approves a new car before it's sold: the maker certifies that it meets the safety standards, the regulator buys cars afterwards to test them, and if one fails, it orders a recall. In Germany a car may only be sold and registered once an authority has approved its type. {{FR-2020-28107 EU-2018-858}}

:::figure permits column
One decision, two schedules: checks after the launch in the United States, before it in Germany, and a type approval that shortens the German route since 2021.
:::

@where United States · T-Mobile US
Putting an agent on customer accounts works like the American car. In T-Mobile's public material I found no check by staff before launch, though that doesn't prove there was none. T-Mobile announced its agent platform in September 2024, and about 21 months later a third of contract customers' calls started with it. A works council in the German sense doesn't exist there; a staff body that T-Mobile had set up itself was ordered dissolved, and a federal appeals court upheld that in January 2024. Other checks come later, as lawsuits and state rules. {{R6-08 R6-06 R11-36 R11-37 R11-41 R11-43}}

@where Germany · Deutsche Telekom
At Telekom the works council, elected by the staff, has to be told while the system is still being planned; since 2021 the law names AI expressly. If a system is suited to monitoring staff, the works council has to agree, and a screen that listens to service calls very likely is. Telekom's own privacy and security experts approve a system before it runs, and the data protection regulation requires an impact assessment before risky processing. {{R11-05 R11-07 R11-08 R11-21 R11-22}}

Telekom has already found its type approval. Before 2021 its works council approved IT systems one by one, by its account about six weeks each. Since then a standing agreement sets the rules once: no control of individual performance, evaluations only for groups, logs only for security. A department fills in a profile of its system, the works council checks it, and if nothing goes beyond the rules no separate decision is needed. A screen that listens to calls probably goes beyond it and needs its own approval, and the agreements that would show how long that takes aren't published. {{R11-12}}

The rules themselves are precise. Under § 87(1) no. 6 of the Works Constitution Act the works council must agree to technical systems suited to monitoring staff. Under the AI Act, customers must be told since 2 August 2026 when they deal with an AI system, and from 2 December 2027 a tool used to monitor or evaluate employees can count as high risk. Firms feel the weight: among those that considered AI and decided against it, 62% named unclear legal consequences and 60% data protection, second and third after missing knowledge. In Germany the inspection comes before the wall is opened, and the work has to be planned for it. {{R11-07 R9-04 R9-05 R7-06}}

## 8. Dependence

@where Germany and Europe
A building is only as independent as what it's made of. In a Bitkom survey of 605 German firms with 20 or more staff, published in November 2025, 51% called themselves strongly dependent on the United States for the digital technology they import. {{B-2025}}

@where Germany · Deutsche Telekom
Telekom is better placed than almost any German firm. Since February 2026 it runs an AI factory in Munich with nearly 10,000 graphics processors, which it sells to industrial customers. For its own staff it still uses OpenAI models in its internal assistant and is rolling out 120,000 OpenAI licences, and which model runs Frag Magenta isn't disclosed. If even Telekom reaches for American materials for its own house, firms without a factory of their own will do so all the more. {{R6-24 R6-17 R6-02 R6-05}}

I think that's a problem. A house built from one foreign supplier's parts is at that supplier's mercy: it sets the price, the delivery dates and the rules for what may be stored where. Telekom describes its European platform as able to switch between models. That switch matters more than any single model. {{R6-04}}

## 9. The renovation, in order

@where Germany · Deutsche Telekom
Telekom has planned part of the renovation already. What I didn't find in its public plan is the order, and a date for the work in the walls. This is the order I'd follow. It's the order of a renovation in an occupied house: survey, plan, approval, trades, then the main supply, then one room at a time, and someone who looks after the house afterwards.

:::figure roadmap wide
The renovation as a site schedule. The rows run in order; the people stay at home throughout, and every step is inspected. The list under it says what each row means for Telekom.
:::

1. **Survey.** One measure for both countries, with its cost: requests finished without a person that didn't come back within a week, set against what the agent costs to build and run. Today no pair of figures compares fully, so the 2030 target can't be checked from outside. *Measure:* the pair exists and is published.
2. **Plan and choose materials.** Keep the switch between model suppliers, and keep sensitive customer data on hosting Telekom controls in Germany. *Measure:* how long a change of model supplier takes, including new tests and the works council's review. {{R6-04}}
3. **Approval.** Settle the works agreement for the screen that listens to calls, and its status under the AI Act, while the system is planned, not after it's built. Since 2 August 2026 customers must be told when they deal with an AI system, and from December 2027 a tool used to monitor or evaluate employees can count as high risk. *Measure:* signed before the first room is opened. {{R11-07 R9-04 R9-05}}
4. **Trades first.** The service staff who stay learn to work with the new tools before the tools reach customers, starting with the least experienced, for whom the measured gain is largest. *Measure:* cases solved per hour and repeat contacts. {{R4-29}}
5. **The main supply.** Cut the 14 ways of proving who's calling to three and make the customer data usable before agents act on accounts: Telekom's own "simplify before automating", with a date. *Measure:* the share of calls in which the caller is recognised without questions. {{R6-05}}
6. **Room by room, keys in steps.** First let the agent read: show a bill, check an order. Then actions that can be undone, such as restarting a line. Changes that fraud could use come last, with a confirmation from the customer and a named person who answers for that kind of action. Frag Magenta can already change bank details after login; that's the key I'd review first. *Measure:* errors per thousand actions, room by room. {{R6-16}}
7. **Running it.** Someone looks after the house once the work is done: a named team that answers for the agents, nights included, and the cost of each request watched like the electricity bill. The return, until the end of 2028, has to come from fewer repeat contacts, from staff moving to work software can't do, and from customer service's share of the roughly 4,000 who leave each year by the agreed routes. *Measure:* cost per finished request. {{R11-14 R12-01}}

## Where this could be wrong

The analogy simplifies. One in five new German homes approved in 2020 was already timber, many German firms run modern systems, and software walls, unlike brick, can be rebuilt completely. I use the houses for one property only: how hard it is to add a new connection to what already stands. {{DESTATIS-2021}}

Three findings would show that my argument is wrong. If Telekom reports a German figure built like T-Mobile's 32% before its work on authentication and customer data is finished, the main supply mattered less than I claim. If staff numbers in customer service fall faster than the agreed routes allow, the residents are leaving after all. And if a works agreement for the service systems is published with its dates and shows months of delay, the law is a bigger weight than I give it here.

What I couldn't show from public sources: that the agents alone caused the fall in American service contacts; that any approval delayed a Telekom service system, or that none did; which model runs Frag Magenta and where; and how many of the positions that left, on either side, were in customer service.

## How this was made

The question, the argument and the choice of the case are mine. The picture of timber and brick houses is my father's: he's a civil engineer. I used AI assistants to find and open sources (company reports and slides, filings, legal texts, official statistics, published studies), to draft passages from my notes and dictations, and to check every claim against its source. AI critics, each reading as someone else (a professor, an engineer, a practitioner, a reader with no background), went through the drafts, and what they found wrong was fixed. I decided what stays. Every figure carries its source; select the mark at the end of a passage to open it.

## Appendix: the ten pairs

Every American figure next to the nearest German one. A pair could be compared if both sides counted the same thing, in the same period, in the same way.

:::figure pairs wide
Ten pairs of figures, the United States on the left and Germany on the right. None compares fully; one does in part.
:::
