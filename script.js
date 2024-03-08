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

let resultArray = [];

function getChampNames(data) {
  data.forEach((event) => {
    let killerId = event.killerId;
    let victimId = event.victimId;
    let victimName = "";

    if (event.victimDamageReceived && event.victimDamageReceived.length > 0) {
      let killerEntry = event.victimDamageReceived.find(
        (entry) => entry.participantId === killerId
      );

      if (
        killerEntry &&
        !resultArray.some((obj) => obj.victimId === killerId)
      ) {
        resultArray.push({ victimId: killerId, victimName: killerEntry.name });
      }
    }

    if (event.victimDamageDealt && event.victimDamageDealt.length > 0) {
      victimName = event.victimDamageDealt[0].name;

      if (!resultArray.some((obj) => obj.victimId === victimId)) {
        resultArray.push({ victimId: victimId, victimName: victimName });
      }
    }
  });

  return resultArray;
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
    const file1Path = "faker.json";
    const file2Path = "champ@1.json";
    const file3Path = "item.json";

    // Fetch data from multiple files using Promise.all
    const [game2, namefilechamp, namefileitem] = await Promise.all([
      fetch(file1Path).then((response) => response.json()),
      fetch(file2Path).then((response) => response.json()),
      fetch(file3Path).then((response) => response.json()),
    ]);

    // Return the fetched data
    return { game2, namefilechamp, namefileitem };
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
  });

  // Call the fetchData function
  const { game2, namefilechamp, namefileitem } = await fetchData();

  const modifiedGame2Info =
    game2?.info?.frames?.map((item) => ({
      events: item.events.filter((event) => event.type === "CHAMPION_KILL"),
      participantFrames: item.participantFrames,
      timestamp: item.timestamp,
    })) || [];
  let flattenedEvents2 = modifiedGame2Info.flatMap((item) => item.events);
  let listChamp = getChampName(flattenedEvents2);
  let myData = getChampNames(flattenedEvents2);
  console.log(myData);
  const modifiedGame2Frames =
    game2?.info?.frames?.map((item) => ({
      participantFrames: item.participantFrames,
      timestamp: item.timestamp,
    })) || [];

  const dataItem = game2["info"]["frames"];

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
      updateItem(val);
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

  const legendDiv = document.getElementById("legend");

  // Ajout des legendes
  const svg2 = d3
    .select(legendDiv)
    .append("svg")
    .attr("width", 100)
    .attr("height", 60);

  svg2
    .append("circle")
    .attr("cx", 10)
    .attr("cy", 20)
    .attr("r", 8)
    .attr("fill", "red");

  svg2
    .append("text")
    .attr("x", 30)
    .attr("y", 25)
    .text("Red team kill")
    .attr("fill", "black")
    .style("font-size", "12px");

  svg2
    .append("circle")
    .attr("cx", 10)
    .attr("cy", 50)
    .attr("r", 8)
    .attr("fill", "blue");

  svg2
    .append("text")
    .attr("x", 30)
    .attr("y", 55)
    .text("Blue team kill")
    .attr("fill", "black")
    .style("font-size", "12px");

  // Fonction qui met à jour la map en fonction du temps dans le slider
  function updateGraph(selectedTime) {
    const filteredData = flattenedEvents2.filter(
      (event) => event.timestamp <= selectedTime
    );

    svg.selectAll("circle").remove();

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

        if (event.assistingParticipantIds) {
          killHtml += `<div>`;
          for (let i = 0; i < event.assistingParticipantIds.length; i++) {
            let assistantImgSrc = getChampionImageSrc(
              listChamp.get(`${event.assistingParticipantIds[i]}`)
            );
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

  updateGraph(0);

  function updateStat(selectedTime, param2 = "totalGold") {
    d3.select("#teams_data").select("svg").remove();

    // Filtrage des données en fonction du slider
    let filteredData = modifiedGame2Frames.filter(
      (event) => event.timestamp <= selectedTime
    );

    let flattenedParticipantFrames = [].concat(
      ...filteredData.map((item) =>
        Object.values(item.participantFrames).flat()
      )
    );

    let dataForChart = flattenedParticipantFrames.map((frame) => ({
      participantId: frame.participantId.toString(),
      selectedValue: +frame[param2], // Parse to number
    }));
    if (dataForChart.length === 0) {
      console.warn("No valid data to display.");
      return;
    }

    var containerWidth = document.getElementById("teams_container").clientWidth;

    var svg2 = d3
      .select("#teams_data")
      .append("svg")
      .attr("width", containerWidth) // Set the width to be equal to the container width
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3
      .scaleLinear()
      .domain([0, d3.max(dataForChart, (d) => +d.selectedValue)])
      .range([0, width]);
    svg2
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", "translate(0," + height + ")") // Move the X axis to the bottom
      .call(d3.axisBottom(x));

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
      .attr("dy", "0.35em")
      .each(function (d) {
        var champName = listChamp.get(d);
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

  function updateItem(selectedTime) {
    d3.select("#champ_items").select("svg").remove();

    const height = 700;
    const width = 600;
    const margin = { top: 20, left: 20, bottom: 20, right: 20 };
    const padding = 20;

    let item_data = dataItem.flatMap((key) =>
      key["events"].filter(
        (d) =>
          (d.type === "ITEM_PURCHASED" || d.type === "ITEM_DESTROYED") &&
          d.timestamp <= selectedTime
      )
    );

    let itemchamp = item_data.reduce((result, d) => {
      const participantId = d.participantId;
      const itemId = d.itemId;
      const type = d.type;

      // Find the corresponding entry in the result array
      let entry = result.find((entry) => entry[0] === participantId);

      // If the entry doesn't exist, create a new one
      if (!entry) {
        entry = [participantId, []];
        result.push(entry);
      }

      // Find the corresponding item entry in the inner array
      let itemEntry = entry[1].find((item) => item === itemId);

      // If the item entry doesn't exist, create a new one
      if (!itemEntry) {
        const purchasedCount = item_data.filter(
          (d) =>
            d.participantId === participantId &&
            d.itemId === itemId &&
            d.type === "ITEM_PURCHASED"
        ).length;

        const destroyedCount = item_data.filter(
          (d) =>
            d.participantId === participantId &&
            d.itemId === itemId &&
            d.type === "ITEM_DESTROYED"
        ).length;

        // Check the condition for inclusion
        if (purchasedCount > destroyedCount) {
          entry[1].push(itemId);
        }
      }

      return result;
    }, []);
    console.log(itemchamp);

    const svg = d3
      .select("#champ_items")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const sortedData = myData.sort((a, b) => a.victimId - b.victimId);

    const data = sortedData;
    console.log(data);

    const zoneface = svg
      .append("g")
      .attr("class", "face")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const y = d3
      .scaleBand()
      .domain(d3.range(data.length))
      .range([margin.top, height - margin.bottom - margin.top]);

    const x = d3
      .scaleBand()
      .domain(d3.range(10))
      .range([margin.left + y.bandwidth(), width - margin.right]);

    zoneface
      .selectAll("zonejoueur")
      .data(data)
      .enter()
      .append("image")
      .attr("x", 0)
      .attr("y", (d) => {
        console.log(d);
        return y(d["victimId"] - 1);
      })
      .attr("width", y.bandwidth())
      .attr("height", y.bandwidth())
      .attr(
        "xlink:href",
        (d) =>
          "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/" +
          namefilechamp[d["victimName"]] +
          ".png"
      );

    const zonestuff = svg
      .selectAll("test")
      .data(data)
      .enter()
      .append("g")
      .attr(
        "transform",
        (d) =>
          "translate(" +
          margin.left +
          "," +
          (y(d["victimId"] - 1) + margin.top) +
          ")"
      );

    zonestuff
      .selectAll("items")
      .data((champ) => {
        const filteredData = itemchamp.filter(
          (d) => d[0] === champ["victimId"]
        )[0][1];
        console.log(filteredData);

        return filteredData.map((item, index) => ({
          itemId: item,
          victimId: champ["victimId"],
          index: index,
        }));
      })
      .enter()
      .append("image")
      .attr("x", (d) => x(d.index))
      .attr("y", 0)
      .attr("width", x.bandwidth())
      .attr("height", x.bandwidth())
      .attr(
        "xlink:href",
        (d) =>
          "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/items/icons2d/" +
          namefileitem[d.itemId]
      );
  }
  updateItem(186193);
})();
