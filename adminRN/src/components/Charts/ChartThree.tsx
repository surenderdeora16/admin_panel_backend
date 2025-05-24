"use client"

import type { ApexOptions } from "apexcharts"
import type React from "react"
import { useState } from "react"
import ReactApexChart from "react-apexcharts"

interface ChartThreeState {
  series: {
    name: string
    data: number[]
  }[]
}

interface ChartThreeProps {
  data: Array<{ _id: string; count: number }>
  title?: string
  subtitle?: string
}

const ChartThree: React.FC<ChartThreeProps> = ({
  data = [],
  title = "Performance Analytics",
  subtitle = "Score distribution analysis",
}) => {
  const [state] = useState<ChartThreeState>({
    series: [
      {
        name: "Students",
        data: data.map((item) => item.count || 0),
      },
    ],
  })

  const options: ApexOptions = {
    chart: {
      fontFamily: "Satoshi, sans-serif",
      type: "bar",
      height: 335,
      toolbar: {
        show: true,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        borderRadius: 2,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories: data.map((item) => {
        if (typeof item._id === "string" && item._id.includes("-")) {
          const [min, max] = item._id.split("-")
          return `${min}-${max}%`
        }
        return item._id
      }),
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
    },
    grid: {
      strokeDashArray: 5,
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: (val) => val + " students",
      },
    },
    colors: ["#3C50E0"],
    yaxis: {
      title: {
        text: "Number of Students",
        style: {
          fontSize: "12px",
          fontWeight: 600,
        },
      },
    },
  }

  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white p-7.5 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-4">
      <div className="mb-4 justify-between gap-4 sm:flex">
        <div>
          <h4 className="text-xl font-semibold text-black dark:text-white">{title}</h4>
          <p className="text-sm text-body dark:text-bodydark">{subtitle}</p>
        </div>
      </div>

      <div>
        <div id="chartThree" className="-ml-5 h-[355px] w-[105%]">
          <ReactApexChart options={options} series={state.series} type="bar" height={355} />
        </div>
      </div>
    </div>
  )
}

export default ChartThree
