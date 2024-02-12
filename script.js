const filePath = "faker.json";

// Fonction qui récupère l'image du champion en fonction de son nom
function getChampionImageSrc(championName) {
  const imageSrc = `img/${championName}.png`;
  return imageSrc;
}

// Fonction qui renvoit la liste de tout les champions avec leur id
let myMap = new Map();
function getChampName(data) {
  data.forEach((event) => {
    let killerId = event.killerId;
    let killerEntry = event.victimDamageReceived.find(
      (entry) => entry.participantId === killerId
    );
    myMap.set(`${killerId}`, `${killerEntry.name}`);
    let victimId = event.victimId;
    let victimName = "";
    if (event.victimDamageDealt) {
      victimName = event.victimDamageDealt[0].name;
      myMap.set(`${victimId}`, `${victimName}`);
    }
  });
  return myMap;
}

// Fonction qui récupère la liste des champions et qui les ajoute dans une div avec les images
function generateTeamHTML(championMap, targetContainerClass) {
  let targetContainer = document.querySelector(`.${targetContainerClass}`);
  let teamRed = [];
  let teamBlue = [];

  championMap.forEach((champion, key) => {
    let championImgSrc = getChampionImageSrc(champion); // Replace with your actual function
    if (parseInt(key) >= 1 && parseInt(key) <= 5) {
      teamRed.push(
        `<img src="${championImgSrc}" alt="${champion}" width="50" height="50" style="margin-bottom: 5px;" /> <br>`
      );
    } else if (parseInt(key) >= 6 && parseInt(key) <= 10) {
      teamBlue.push(
        `<img src="${championImgSrc}" alt="${champion}" width="50" height="50" style="margin-bottom: 5px;" /> <br>`
      );
    }
  });

  // Add HTML to targetContainer
  targetContainer.innerHTML = `
    <div>
      <h2>Red Team</h2>
      ${teamRed.join("")}
    </div>
    <div>
      <h2>Blue Team</h2>
      ${teamBlue.join("")}
    </div>
  `;
}

// Fonction qui récupère les données depuis le json
async function fetchData() {
  try {
    const response = await fetch(filePath);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error loading JSON:", error);
  }
}

(async () => {
  let selected = "";

  document.getElementById("mySelector").addEventListener("change", function () {
    // Get the selected value from the dropdown
    selected = document.getElementById("mySelector").value;
    const currentValue = slider.value();
    updateStat(currentValue, selected);
    console.log(selected);
  });

  // Call the fetchData function
  const game2 = await fetchData();
  const modifiedGame2Info =
    game2?.info?.frames?.map((item) => ({
      events: item.events.filter((event) => event.type === "CHAMPION_KILL"),
      participantFrames: item.participantFrames,
      timestamp: item.timestamp,
    })) || [];
  let flattenedEvents2 = modifiedGame2Info.flatMap((item) => item.events);
  let listChamp = getChampName(flattenedEvents2);
  console.log(listChamp);
  const modifiedGame2Frames =
    game2?.info?.frames?.map((item) => ({
      participantFrames: item.participantFrames,
      timestamp: item.timestamp,
    })) || [];

  console.log(modifiedGame2Frames);
  // generateTeamHTML(listChamp, "teams-container");

  //// Premier plot avec la map

  // Plot creation
  const margin = { top: 20, right: 20, bottom: 80, left: 50 };
  const width = 600 - margin.left - margin.right;
  const height = 600 - margin.top - margin.bottom;

  const x = d3
    .scaleLinear()
    .domain([0, 16000])
    .range([margin.left, width + margin.left]);
  const y = d3
    .scaleLinear()
    .domain([0, 15500])
    .range([height + margin.top, margin.top]);

  const svg = d3
    .select("#my_dataviz")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("width", "auto%")
    .style("height", "auto");

  svg
    .append("image")
    .attr("xlink:href", "map.png")
    .attr("width", 500)
    .attr("height", 500)
    .attr("x", margin.left)
    .attr("y", margin.top);

  // Add x-axis
  const xAxis = svg
    .append("g")
    .attr("transform", `translate(0,${height + margin.top})`)
    .call(d3.axisBottom(x));

  // Add y-axis
  const yAxis = svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  // Hide both axes
  xAxis.select("path").style("display", "none");
  xAxis.selectAll("line").style("display", "none");
  yAxis.select("path").style("display", "none");
  yAxis.selectAll("line").style("display", "none");
  xAxis.selectAll("text").style("display", "none");
  yAxis.selectAll("text").style("display", "none");

  const slider = d3
    .sliderHorizontal()
    .min(d3.min(flattenedEvents2, (d) => d.timestamp))
    .max(d3.max(flattenedEvents2, (d) => d.timestamp))
    .step(1)
    .width(width)
    .on("onchange", (val) => {
      selected = document.getElementById("mySelector").value;
      updateGraph(val);
      updateStat(val, (param2 = selected));
    });

  svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${height + margin.top + 10})`)
    .call(slider);

  const tooltip = d3
    .select("#my_dataviz")
    .append("div")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden")
    .style("background", "rgba(255, 255, 255, 0.8)")
    .style("padding", "8px")
    .style("border-radius", "4px");

  // Fonction qui met à jour la map en fonction du temps dans le slider
  function updateGraph(selectedTime) {
    const filteredData = flattenedEvents2.filter(
      (event) => event.timestamp <= selectedTime
    );

    svg.selectAll("circle").remove(); // Clear existing circles

    // Add new circles with hover interaction
    // Les points représente l'équipe qui a fait le kill
    svg
      .selectAll("circle")
      .data(filteredData)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.position.x))
      .attr("cy", (d) => y(d.position.y))
      .attr("r", 5)
      .attr("fill", (d) =>
        d.killerId >= 1 && d.killerId <= 5 ? "red" : "blue"
      )
      .on("mouseover", (event, d) => {
        // getAssist(event);
        const killerImgSrc = getChampionImageSrc(
          `${listChamp.get(`${event.killerId}`)}`
        );
        const victimImgSrc = getChampionImageSrc(
          `${listChamp.get(`${event.victimId}`)}`
        );

        let killHtml =
          `<div class="kill-container">` +
          `<img src="${killerImgSrc}"  width="80" height="80" />` +
          ` <img src="kill.png"  width="50" height="50" /> ` +
          `<img src="${victimImgSrc}" width="80" height="80" />` +
          `</div>`;

        // Loop through assistingParticipantIds and add assistant images
        if (event.assistingParticipantIds) {
          killHtml += `<div>`;
          for (let i = 0; i < event.assistingParticipantIds.length; i++) {
            let assistantImgSrc = getChampionImageSrc(
              listChamp.get(`${event.assistingParticipantIds[i]}`)
            ); // Replace this with the actual function to get assistant image source
            killHtml += `<img src="${assistantImgSrc}" width="50" height="50" style="margin-top: 10px;  margin-right: 5px;" />`;
          }
          killHtml += `</div>`;
        }

        tooltip
          .style("visibility", "visible")
          .html(killHtml)
          .style("left", event.pageX + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      });
  }

  // Initial plot
  updateGraph(0);

  //// Second graphe
  // function updateStat(selectedTime, param2 = "totalGold") {
  //   // Remove existing chart
  //   d3.select("#teams_data").select("svg").remove();

  //   // Filter data based on selected time
  //   const filteredData = modifiedGame2Frames.filter(
  //     (event) => event.timestamp <= selectedTime
  //   );

  //   // Extract and flatten participantFrames content
  //   const flattenedParticipantFrames = [].concat(
  //     ...filteredData.map((item) =>
  //       Object.values(item.participantFrames).flat()
  //     )
  //   );
  //   // Extract participantIds and currentGold for the bar chart
  //   const dataForChart = flattenedParticipantFrames.map((frame) => ({
  //     participantId: frame.participantId.toString(),
  //     // selectedValue: frame.selectedValue,
  //     selectedValue: frame[param2].toString(),
  //   }));
  //   // Create a new SVG container
  //   // Assuming teams_container is the ID of your container
  //   var containerWidth = document.getElementById("teams_container").clientWidth;

  //   // Create a new SVG container
  //   var svg2 = d3
  //     .select("#teams_data")
  //     .append("svg")
  //     .attr("width", containerWidth) // Set the width to be equal to the container width
  //     .attr("height", height + margin.top + margin.bottom)
  //     .append("g")
  //     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  //   // X axis
  //   var x = d3
  //     .scaleLinear()
  //     .domain([0, d3.max(dataForChart, (d) => +d.selectedValue)])
  //     .range([0, width]);
  //   svg2
  //     .append("g")
  //     .attr("class", "x-axis")
  //     .attr("transform", "translate(0," + height + ")") // Move the X axis to the bottom
  //     .call(d3.axisBottom(x));

  //   // Y axis
  //   // Y axis
  //   var y = d3
  //     .scaleBand()
  //     .range([0, height])
  //     .domain(
  //       dataForChart.map(function (d) {
  //         return d.participantId;
  //       })
  //     )
  //     .padding(0.2);
  //   svg2.append("g").attr("class", "y-axis").call(d3.axisLeft(y));

  //   // Add images to the Y-axis ticks
  //   svg2
  //     .selectAll(".y-axis .tick text")
  //     .attr("dy", "0.35em") // Adjust this value based on your layout
  //     .each(function (d) {
  //       var champName = listChamp.get(d);
  //       // Replace text with champion name
  //       d3.select(this).text(champName);
  //     });

  //   // Bars
  //   svg2
  //     .selectAll(".mybar")
  //     .data(dataForChart)
  //     .enter()
  //     .append("rect")
  //     .attr("class", "mybar")
  //     .attr("fill", function (d) {
  //       // Set fill color based on participant ID
  //       return +d.participantId >= 1 && +d.participantId <= 5 ? "red" : "blue";
  //     })
  //     .attr("y", function (d) {
  //       return y(d.participantId);
  //     })
  //     .attr("x", 0)
  //     .attr("height", y.bandwidth())
  //     .attr("width", function (d) {
  //       console.log(d);
  //       return x(d.selectedValue);
  //     });
  // }

  function updateStat(selectedTime, param2 = "totalGold") {
    // Remove existing chart
    d3.select("#teams_data").select("svg").remove();

    // Filter data based on selected time
    let filteredData = modifiedGame2Frames.filter(
      (event) => event.timestamp <= selectedTime
    );

    // Extract and flatten participantFrames content
    let flattenedParticipantFrames = [].concat(
      ...filteredData.map((item) =>
        Object.values(item.participantFrames).flat()
      )
    );
    console.log(flattenedParticipantFrames);

    // Extract participantIds and selectedValue for the bar chart
    let dataForChart = flattenedParticipantFrames.map((frame) => ({
      participantId: frame.participantId.toString(),
      selectedValue: +frame[param2], // Parse to number
    }));
    console.log(dataForChart);
    // Avoid empty SVG
    if (dataForChart.length === 0) {
      console.warn("No valid data to display.");
      return;
    }

    // Create a new SVG container
    var containerWidth = document.getElementById("teams_container").clientWidth;

    // Create a new SVG container
    var svg2 = d3
      .select("#teams_data")
      .append("svg")
      .attr("width", containerWidth) // Set the width to be equal to the container width
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // X axis
    var x = d3
      .scaleLinear()
      .domain([0, d3.max(dataForChart, (d) => +d.selectedValue)])
      .range([0, width]);
    svg2
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", "translate(0," + height + ")") // Move the X axis to the bottom
      .call(d3.axisBottom(x));

    // Y axis
    var y = d3
      .scaleBand()
      .range([0, height])
      .domain(
        dataForChart.map(function (d) {
          return d.participantId;
        })
      )
      .padding(0.2);
    svg2.append("g").attr("class", "y-axis").call(d3.axisLeft(y));
    svg2
      .selectAll(".y-axis .tick text")
      .attr("dy", "0.35em") // Adjust this value based on your layout
      .each(function (d) {
        var champName = listChamp.get(d);
        // Replace text with champion name
        d3.select(this).text(champName);
      });
    // Bars
    svg2
      .selectAll(".mybar")
      .data(dataForChart)
      .enter()
      .append("rect")
      .attr("class", "mybar")
      .attr("fill", function (d) {
        // Set fill color based on participant ID
        return +d.participantId >= 1 && +d.participantId <= 5 ? "red" : "blue";
      })
      .attr("y", function (d) {
        return y(d.participantId);
      })
      .attr("x", 0)
      .attr("height", y.bandwidth())
      .attr("width", function (d) {
        return x(d.selectedValue);
      });

    flattenedParticipantFrames = [];
    dataForChart = [];
  }

  updateStat(0, (param2 = "totalGold"));
})();
