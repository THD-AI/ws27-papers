---
title: Renovate, don't repaint
deck: Deutsche Telekom points to its American subsidiary as proof that software agents can run customer service. I checked what that proof is made of, and which part of it a German company can have.
author: Alexander Rudaev
context: Innovation Management for AI · TH Deggendorf · winter semester 2026/27
status: Draft for review, 16 November 2026
accent: renovate
---

:::margin house 0

## What I wanted to know

On 5 October 2026 Deutsche Telekom told investors that software agents now do a large part of its customer service in the United States, and that it wants the same in Europe by 2030. A software agent here means a program that does not only answer a customer but carries out a step in the customer's account, such as changing a tariff. When I write "service staff" I mean the people. {{R6-01 R6-03}}

I started with an assumption: a European company cannot take over such a result by buying the same software, because the result rests on work underneath it. I compared it to a house. You renew the foundations and the wiring before you paint. This text reports what I found when I checked that assumption against Telekom's own documents, and where the assumption was wrong.

## 1. The announcement

@where Deutsche Telekom's release · about the United States
T-Mobile US is a subsidiary of Deutsche Telekom. Deutsche Telekom's release of 5 October says that at T-Mobile, AI agents "handle 40 percent of customer contacts" and that service calls fell by 55%. The same release reports 2.6 million calls in the first half of 2026 that Frag Magenta, Telekom's chatbot and phone bot, took off the hotline. That is about 14,000 a day. The release gives no total to set it against, and another Telekom slide gives 2.1 million for Germany alone; how the two counts relate is not explained. {{R6-01 R6-03 R10-50}}

The release does not say why the two markets differ. It presents the American result as the model.

## 2. What the American numbers measure

@where United States · T-Mobile US
I compared the release with the slides T-Mobile US showed at Deutsche Telekom's investor day on the same date, and with what T-Mobile filed with the American securities regulator. All of these are the company's own figures. None of the service figures is audited. {{R6-02 R6-06 R6-09}}

:::scene numbers

@caption What the two headline figures count. Left: of 100 contacts, the release speaks of 40 without saying whose, and T-Mobile's own slide counts 32 that start with the software. Right: contacts per customer account in a year, at the two dates that are public.

@step 0
**The 40%.** I could not find it anywhere in T-Mobile's material. {{R6-01 R6-06}}

@step 1
T-Mobile's slide gives 32%, and says what it counts: contacts from contract customers that were "served by an AI agent" in the second quarter of 2026. {{R6-06}}

@step 2
T-Mobile's head of IT described these as calls where the customer gets the software "from the beginning". The figure counts calls that start with the software. How many of them the software finished is not published. {{R6-02}}

@step 3
**The 55%.** It comes from a series T-Mobile has reported since 2021: how often an average customer account contacts customer care in a year. At the end of 2021 that was 7.0 times, about once every seven weeks. In mid-2026 it was 3.1 times, about once every four months. Only these two points are public. {{R6-06 R6-12}}

@step 4
The agent platform was announced in September 2024, almost three years after the series begins. T-Mobile itself names other causes: problems removed before customers call, and customers doing things in the app. I cannot say how much of the fall belongs to the agents, and T-Mobile does not say either. {{R6-08 R6-14}}

:::

@where United States and Germany · side by side
**The comparison.** I put every figure for the US next to the nearest figure for Germany and got ten pairs. In none of them do the two sides fully count the same thing over the same period. {{R6-06 R6-16 R6-03}}

:::figure pairs wide
Ten pairs of figures, the United States on the left and Germany on the right. A pair could be compared if both sides counted the same thing, in the same period, in the same way. None does fully; one does in part.
:::

So from public figures I cannot tell by how much Germany is behind, or whether it is.

:::margin house 1

## 3. What T-Mobile says it did before the agents

@where United States · T-Mobile US
T-Mobile's managers describe what they changed. This is their account, given to investors. {{R6-02}}

- **Software.** Its head of IT said the company had "a largely outsourced, third-party workforce" working on systems owned by suppliers, and replaced it with its own engineers on its own systems. {{R6-02}}
- **Customer data.** It built one system that holds what the company knows about each customer. The agents read from it. {{R6-06 R6-02}}
- **Who is calling.** A customer who calls from a T-Mobile phone is recognised automatically. An agent that may change a contract has to know whose contract it is. {{R6-02}}
- **One app.** About 32 million people use it every month, and more than 80% of phone upgrades are done digitally. {{R6-14 R6-12}}
- **Cost.** Its filings show 278 million dollars written off on a billing system that was being replaced, which means money already spent on it was booked as lost, and 531 million dollars of severance in a programme it calls workforce transformation. {{R6-09 R6-11}}

All of these steps concern the systems around the model. In the picture of the house they are the foundations and the wiring. On the order of the work I have one statement and two dates: T-Mobile's head of IT says the company first had to replace its outsourced IT, and the costs in its filings fall in 2025 and 2026.

:::margin house 2

## 4. Telekom is renovating too

@where Germany · Deutsche Telekom
Telekom in Germany already runs Frag Magenta for more than 380 kinds of request. After login it can do a few things itself, such as show a bill or change bank details. Otherwise it hands the chat to a member of the service staff with a summary. The staff have their own program on screen during a call. It listens to the call and writes the record, 50,000 times a day. {{R6-16 R6-02}}

Telekom's slides for Europe also list what is unfinished. Customers prove who they are in 14 different ways across its countries, to be cut to 3. Customer data sits in separate systems that still have to be made usable for agents. The slide states the principle "Simplify before automating". {{R6-05}}

This is where my assumption needed its first correction. I had expected to find a company painting over old walls. Telekom's own slides describe part of the same renovation, as planned work: the ways customers prove who they are, and the data. They do not mention bringing software back in-house or replacing billing, as T-Mobile did. The difference I found is in timing. T-Mobile reports its work as done and its result as measured. Telekom sets its result targets for 2030, half as many calls and chats as in 2023 and every call answered first by software, and gives no date for finishing the work underneath. {{R6-03 R6-04}}

:::margin house 3

## 5. Less deep, and dependent

The rest of my assumption was that European companies adjust more slowly and end up relying on American technology. For that I looked beyond Telekom.

@where European Union and Germany
**Less deep.** The European Commission's own report for 2026 says 20% of firms in the Union with ten or more staff used AI in 2025, and that AI uptake is "far from being on track" for the 2030 target of 75% of firms using AI, cloud or data analytics. A survey by the European Investment Bank asks firms in the EU and the US the same questions and counts differently: it weights firms by their size in the economy, so its shares are higher. In it, about as many European firms as American ones use AI somewhere, 68% against 72%. Fewer use it in two or more parts of the business, 44% against 58%, and fewer in customer service, 22% against 29%. In 2025 private investment in AI was 286 billion dollars in the United States and 21 billion in Europe, about 14 times as much in the United States. None of these figures measures speed. They show how widely AI is used and how much is spent on it. {{R7-14 R10-01 R1-03}}

**Dependent.** In a Bitkom survey of 605 German firms with 20 or more staff, published in November 2025, 51% called themselves strongly dependent on the United States for the digital technology they import, up from 41% in January of that year. European providers hold about 15% of Europe's own cloud market; in 2017 it was 29%. The same holds for Telekom's own tools. Its internal assistant runs partly on OpenAI models, it is rolling out 120,000 OpenAI licences, and the reference data platform on its slide uses Google's BigQuery, in public and sovereign cloud. In 2024 Telekom named GPT-4 for one Frag Magenta example; which model runs it today is not disclosed. Telekom describes its European platform as able to use different models. {{B-2025 SRG-2025 R6-17 R6-02 R6-05 R6-04 R10-52}}

**The law.** German firms that considered AI but do not use it were asked why. Unclear legal consequences (62%) and data protection (60%) come second and third, behind missing knowledge (72%). {{R7-06}}

:::figure obstacles column
Reasons German firms gave in 2025 for not using AI after considering it. Several answers were possible; the six most named are shown. Source: Federal Statistical Office.
:::

So firms do name the law as an obstacle, and two rules of the EU AI Act apply to Telekom directly. Since 2 August 2026 people must be told that they are dealing with an AI system, unless that is obvious. From 2 December 2027 a tool used to monitor or evaluate employees can count as high risk; systems placed on the market before then are covered only if their design changes significantly. What I could not find is a case where a rule stopped or delayed Telekom's service systems. The next section says why that is hard to know from outside. {{R9-04 R9-05 R4-01}}

:::margin house 4

## 6. The path of one decision

I followed one decision on both sides: to let a software agent act on customer accounts and work next to service staff. I call each point where someone other than management has to be informed, has to agree, or has to approve a gate.

:::scene path

@caption One decision on both sides. In the United States it reaches launch without a gate, and the checks follow. In Germany it passes gates before launch, and dismissal as a way to collect the saving is shut until the end of 2028.

@step 0
@where Both companies
The same decision starts on both sides.

@step 1
@where United States · T-Mobile US
**United States.** I found no gate before launch. T-Mobile announced its agent platform in September 2024, and about 21 months later a third of contract customers' calls started with it. A works council in the German sense does not exist there. T-Mobile had set up a staff body of its own; the American labour board found that the company dominated it and ordered it dissolved, and a federal appeals court upheld that in January 2024. {{R6-08 R6-06 R11-36 R11-37}}

@step 2
One telecoms rule applies before any call is answered: a caller must be authenticated before call details are disclosed, and T-Mobile meets it by recognising its own phones. Other checks come after launch, as lawsuits and state rules. {{R11-40 R11-41 R11-43}}

@step 3
@where Germany · Deutsche Telekom
**Germany.** The research lists eleven gates in Germany; the last, on jobs, applies after launch. The works council, elected by the staff, has to be told while the system is still being planned; since 2021 the law names AI expressly. {{R11-05}}

@step 4
If a system is suited to monitoring staff, the works council has to agree to it. If the two sides do not agree, a conciliation committee with a neutral chair takes a binding decision. The law says "intended to monitor"; the Federal Labour Court holds that being suited to it is enough, where no law or collective agreement already settles the matter. A screen that listens to calls would very likely be covered. {{R11-07 R11-08}}

@step 5
Telekom's own privacy and security experts have to approve a system before it runs. Separately, the data protection regulation requires an impact assessment before risky processing and limits decisions made by software alone. The AI Act adds the duties from section 5. {{R11-21 R11-22 R9-04}}

@step 6
The last gate is about jobs. On 28 May 2026 Telekom and the union ver.di agreed that there will be no dismissals for business reasons until 31 December 2028, for about 60,000 employees. It was subject to the union's approval, whose outcome I did not find. It is a collective agreement and covers only dismissals for business reasons. {{R11-14}}

@step 7
**Did the gates cost time?** Before 2021 they did. Telekom's works council approved IT systems one by one, with six weeks for each and sometimes more than a hundred on the table in one meeting. At another German company approvals took at least twelve months for complex systems before the procedure was changed, six to eight afterwards, and three for simple ones. {{R11-12 R11-30}}

@step 8
**What Telekom changed.** Since a trial that began in November 2018 and became permanent in March 2021, a standing agreement sets rules once for IT systems in general: no control of individual performance, evaluations only for groups, logs only for security. A department fills in a profile of its system, the works council checks it, and if both sides see nothing to object to, the system needs no separate resolution. My source for this is a foundation close to the unions. {{R11-12}}

:::

A system that goes beyond those rules still needs its own agreement, and a screen that listens to calls plausibly goes beyond them. Whether the service systems went through this procedure, and how long it took, is not public. I can say that the gates exist and that they used to cost weeks per system. I cannot say what they cost Telekom's service systems today, because the agreements that would show it are not published. Telekom's chief executive told investors: "I do not have a single situation, even the works council, where I was, always, provoking, saying you stop, you make me slow." That is management's account, the same kind of source as the slides I questioned in section 2, and I found no statement from the works council. {{R11-45}}

Two studies test whether works councils block new technology in German firms. One finds that they do not hinder the adoption of robots. The other, for one federal state, finds no difference in the use of AI once the size and kind of firm are taken into account. An older study finds less digital equipment where there is a works council and makes no claim about cause. None of them measures how long a launch takes. {{R11-25 R11-27 R11-24}}

:::margin house 5

## 7. The part that cannot be copied

@where Germany · Deutsche Telekom
I checked whether promises to the workforce stop change at Telekom. In the numbers I found, staff numbers still fell, through the routes the agreements allow.

Telekom's report on its staff lists those routes for Germany: partial retirement, early retirement, severance, and civil servants retiring or moving to public authorities. From 2021 to 2025, 20,223 full-time equivalents went this way across everything Telekom employs in Germany, about 4,000 a year. Exits by severance nearly doubled, from 526 to 1,016 a year. {{R12-01}}

:::figure exits wide
Every full-time position that left Telekom in Germany by an agreed route, 2021 to 2025. One mark is 25 positions. Source: Deutsche Telekom, HR Factbook 2025.
:::

@where United States · T-Mobile US
In the US, management decides on dismissals itself. Washington State, where T-Mobile is based, allows an employer to dismiss at any time and for any lawful reason; under federal law a mass layoff needs 60 days' written notice and nobody's consent. In August 2023 T-Mobile announced a cut of just under 7% of its staff in one statement, with a charge of 450 million dollars. That cut was mostly in office roles and came a year before the agents, so it shows how an American employer can cut staff; it says nothing about savings from the agents. I could not compare how fast the two companies shrink: the public counts cover different groups, and T-Mobile's rose and fell with company purchases. {{R11-34 R11-35 R11-38 R12-11}}

@where Germany · Deutsche Telekom
This changes the calculation behind an agent in Germany. For the employees under the agreement, a saving cannot be collected by dismissal before 2029. It comes when people leave by one of the paid routes, or when the same people do other work. Telekom's targets run to 2030 and the agreement to the end of 2028; what applies in between is not public.

I also checked whether Germans are more wary of AI than Americans. In two surveys that asked both countries the same questions, they were not. {{R12-25 R12-28}}

:::figure attitudes column
Three questions, each asked the same way in both countries or across the EU. Sources: Ipsos for Google 2025; Ipsos AI Monitor 2025; Eurobarometer 2024 (EU only).
:::

One German result stands out inside Europe: 79% of Germans saw digital monitoring of workers negatively, the second-highest share in the Union. The works council rule in section 6 covers this kind of monitoring.

## 8. When only the result is copied

In 2026 Vodafone in Germany announced that about 2,300 jobs would go or move, and O2 a programme for about 1,100 voluntary exits. Vodafone names AI as one way to save; O2 mentions it as background. {{R12-20 R12-21}}

Klarna, a Swedish payment company, cut further and later reversed part of it. In February 2024 it said its assistant did work that, by its own estimate, equalled 700 service agents. In May 2025 its chief executive said: "Really, investing in the quality of human support is the way of the future for us", and the company began hiring service staff again. {{R12-14 R12-15}}

Two studies looked at when a result did carry over to a new place. After the war, Italian firms whose managers were trained inside American companies did better for at least fifteen years; for firms that only received American machines the gain levelled off. Japanese car plants in North America reached productivity and quality similar to Japan's, and how much of the Japanese way of working they took over varied from practice to practice. {{R12-34 R12-37}}

## 9. What follows for Telekom

@where Germany · Deutsche Telekom
From what I found, the American result has three parts: a model that can be bought, systems around it that Telekom's own slides show as unfinished in Europe, and a quick route to fewer staff that Telekom has agreed not to use until 2029.

Telekom has already planned the second part, so I do not propose it. These are four points I did not find in its public plan:

1. **One measure for both countries, with its cost.** For example: requests finished without a person that did not come back within a week, set against what the agent costs to build and run. Today no pair of figures compares fully (section 2), so nobody outside the company can check the 2030 target.
2. **The agreement for the screen that listens.** It is the system most likely to need the works council's own agreement (section 6), and it could count as high risk under the AI Act if it is used to monitor or evaluate staff. I would expect that settling both while the system is built costs less time than settling them afterwards.
3. **A calculation without dismissals.** Until the end of 2028 the return has to come from fewer repeat contacts, from service staff moving to work software cannot do, and from the share of customer service among the roughly 4,000 who leave each year by the agreed routes (section 7). That share is not public.
4. **Permissions in steps.** First let the agent read: show a bill, check an order. Then actions that can be undone, such as restarting a line. Changes that fraud could use come last, with a confirmation from the customer and a named person who answers for that kind of action. Frag Magenta can already change bank details after login (section 4); that is the case I would review first. A layer that lets the agent change its model supplier is already on Telekom's slide (section 5), so I do not list it.

## 10. What would show that I am wrong

My assumption held in two parts, held in part in one and was wrong in one; one part I could not test.

| I assumed | What I found |
| --- | --- |
| The American result rests on work under the model | Supported by T-Mobile's own account (section 3) |
| European companies are slower with AI | Partly supported: less depth of use and less investment; speed itself is not measured (section 5) |
| They depend on American technology | Supported, for German firms in general and for Telekom (section 5) |
| Telekom is painting over old walls | Wrong. Its slides describe a similar renovation as planned work (section 4) |
| Rules and gates are what holds it back | Not shown. The gates exist; what they cost today is not public (section 6) |

Three things would show that the rest is wrong too. If Telekom reports a German figure built like T-Mobile's 32% before its authentication and data work is finished, the foundations mattered less than I claim. If its staff numbers in customer service fall faster than the agreed routes allow, the jobs gate is softer than it reads. And if a works agreement for the service systems is published with its dates, it would show what the gates cost.

## What I could not show

- That Germany is behind the US by any measured amount.
- That the agents caused the fall in American service contacts.
- That any gate delayed a Telekom service system, or that none did.
- How many of the positions that went, on either side, were in customer service or had to do with AI.
- Which model runs Frag Magenta and where.
- What the staff screen that listens to calls does with what it hears, and under which agreement it runs.

## How this was made

The research, the drafts and the fact reviews were done with AI assistants that I directed. They opened the sources: company reports and slides, filings, legal texts, official statistics and published studies. I chose which ones count, and separate AI review passes checked the claims against them. One result of those reviews: I removed a comparison of staff cuts that did not hold. Every figure carries its source; select the mark at the end of a passage to open it. The question, the choice of sources and every claim are my responsibility.
