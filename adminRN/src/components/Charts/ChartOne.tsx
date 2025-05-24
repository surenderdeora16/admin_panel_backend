"use client"

import type { ApexOptions } from "apexcharts"
import type React from "react"
import { useState } from "react"
import ReactApexChart from "react-apexcharts"

interface ChartOneState {
  series: {
    name: string
    data: number[]
  }[]
}

interface ChartOneProps {
  data: Array<{
    _id: { year: number; month: number; day: number }
    revenue: number
    orders: number
    avgOrderValue?: number
  }>
  title?: string
  subtitle?: string
}

const ChartOne: React.FC<ChartOneProps> = ({
  data = [],
  title = "Revenue Analytics",
  subtitle = "Monthly revenue and order trends",
}) => {
  const [state] = useState<ChartOneState>({
    series: [
      {
        name: "Revenue",
        data: data.map((item) => item.revenue || 0),
      },
      {
        name: "Orders",
        data: data.map((item) => (item.orders || 0) * 1000), // Scale orders for better visualization
      },
    ],
  })

  const options: ApexOptions = {
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["#3C50E0", "#80CAEE"],
    chart: {
      fontFamily: "Satoshi, sans-serif",
      height: 335,
      type: "area",
      dropShadow: {
        enabled: true,
        color: "#623CEA14",
        top: 10,
        blur: 4,
        left: 0,
        opacity: 0.1,
      },
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
      },
    },
    responsive: [
      {
        breakpoint: 1024,
        options: {
          chart: {
            height: 300,
          },
        },
      },
      {
        breakpoint: 1366,
        options: {
          chart: {
            height: 350,
          },
        },
      },
    ],
    stroke: {
      width: [2, 2],
      curve: "smooth",
    },
    grid: {
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    markers: {
      size: 4,
      colors: "#fff",
      strokeColors: ["#3056D3", "#80CAEE"],
      strokeWidth: 3,
      strokeOpacity: 0.9,
      strokeDashArray: 0,
      fillOpacity: 1,
      discrete: [],
      hover: {
        size: undefined,
        sizeOffset: 5,
      },
    },
    xaxis: {
      type: "category",
      categories: data.map((item) => `${item._id.day}/${item._id.month}/${item._id.year}`),
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: [
      {
        title: {
          text: "Revenue (₹)",
          style: {
            fontSize: "12px",
            fontWeight: 600,
          },
        },
        labels: {
          formatter: (val) => "₹" + (val / 1000).toFixed(0) + "K",
        },
      },
      {
        opposite: true,
        title: {
          text: "Orders",
          style: {
            fontSize: "12px",
            fontWeight: 600,
          },
        },
        labels: {
          formatter: (val) => (val / 1000).toFixed(0),
        },
      },
    ],
    tooltip: {
      shared: true,
      intersect: false,
      y: [
        {
          formatter: (val) => "₹" + val.toLocaleString(),
        },
        {
          formatter: (val) => (val / 1000).toFixed(0) + " orders",
        },
      ],
    },
  }

  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white px-5 pt-7.5 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:col-span-8">
      <div className="flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap">
        <div className="flex w-full flex-wrap gap-3 sm:gap-5">
          <div className="flex min-w-47.5">
            <span className="mt-1 mr-2 flex h-4 w-full max-w-4 items-center justify-center rounded-full border border-primary">
              <span className="block h-2.5 w-full max-w-2.5 rounded-full bg-primary"></span>
            </span>
            <div className="w-full">
              <p className="font-semibold text-primary">Total Revenue</p>
              <p className="text-sm font-medium">
                ₹{data.reduce((acc, curr) => acc + (curr.revenue || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex min-w-47.5">
            <span className="mt-1 mr-2 flex h-4 w-full max-w-4 items-center justify-center rounded-full border border-secondary">
              <span className="block h-2.5 w-full max-w-2.5 rounded-full bg-secondary"></span>
            </span>
            <div className="w-full">
              <p className="font-semibold text-secondary">Total Orders</p>
              <p className="text-sm font-medium">
                {data.reduce((acc, curr) => acc + (curr.orders || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-2">
        <h4 className="text-xl font-semibold text-black dark:text-white">{title}</h4>
        <p className="text-sm text-body dark:text-bodydark">{subtitle}</p>
      </div>

      <div id="chartOne" className="-ml-5">
        <ReactApexChart options={options} series={state.series} type="area" height={350} />
      </div>
    </div>
  )
}

export default ChartOne
