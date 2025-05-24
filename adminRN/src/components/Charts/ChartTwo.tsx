"use client"

import type { ApexOptions } from "apexcharts"
import type React from "react"
import { useState } from "react"
import ReactApexChart from "react-apexcharts"

interface ChartTwoState {
  series: number[]
}

interface ChartTwoProps {
  data: Array<{
    _id: { year: number; month: number; day: number }
    count: number
  }>
  title?: string
  subtitle?: string
}

const ChartTwo: React.FC<ChartTwoProps> = ({
  data = [],
  title = "User Analytics",
  subtitle = "User registration trends",
}) => {
  const [state] = useState<ChartTwoState>({
    series: data.map((item) => item.count || 0),
  })

  const options: ApexOptions = {
    chart: {
      fontFamily: "Satoshi, sans-serif",
      type: "donut",
    },
    colors: ["#3C50E0", "#6577F3", "#8FD0EF", "#0FADCF"],
    labels: data.map((item) => `${item._id.day}/${item._id.month}`),
    legend: {
      show: true,
      position: "bottom",
    },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          background: "transparent",
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    responsive: [
      {
        breakpoint: 2600,
        options: {
          chart: {
            width: 380,
          },
        },
      },
      {
        breakpoint: 640,
        options: {
          chart: {
            width: 200,
          },
        },
      },
    ],
  }

  const totalUsers = data.reduce((acc, curr) => acc + (curr.count || 0), 0)

  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white px-5 pt-7.5 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:col-span-5">
      <div className="mb-3 justify-between gap-4 sm:flex">
        <div>
          <h5 className="text-xl font-semibold text-black dark:text-white">{title}</h5>
          <p className="text-sm text-body dark:text-bodydark">{subtitle}</p>
        </div>
      </div>

      <div className="mb-2">
        <div id="chartTwo" className="mx-auto flex justify-center">
          <ReactApexChart options={options} series={state.series} type="donut" />
        </div>
      </div>

      <div className="-mx-8 flex flex-wrap items-center justify-center gap-y-3">
        <div className="w-full px-8 sm:w-1/2">
          <div className="flex w-full items-center">
            <span className="mr-2 block h-3 w-full max-w-3 rounded-full bg-primary"></span>
            <p className="flex w-full justify-between text-sm font-medium text-black dark:text-white">
              <span>Total Registrations</span>
              <span>{totalUsers}</span>
            </p>
          </div>
        </div>
        <div className="w-full px-8 sm:w-1/2">
          <div className="flex w-full items-center">
            <span className="mr-2 block h-3 w-full max-w-3 rounded-full bg-[#6577F3]"></span>
            <p className="flex w-full justify-between text-sm font-medium text-black dark:text-white">
              <span>Daily Average</span>
              <span>{data.length > 0 ? Math.round(totalUsers / data.length) : 0}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChartTwo
