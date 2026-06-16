import { Download, Eye, FileText, ImageIcon } from "lucide-react";



import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";



function FileRow({ label, url, icon: Icon = FileText }) {

  if (!url) return null;

  return (

    <li className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">

      <div className="flex min-w-0 items-center gap-2">

        <Icon className="h-4 w-4 shrink-0 text-gray-500" />

        <span className="truncate text-sm font-medium text-gray-800">{label}</span>

      </div>

      <div className="flex shrink-0 gap-1">

        <Button

          variant="ghost"

          size="sm"

          onClick={() => window.open(url, "_blank")}

          title="View"

        >

          <Eye className="h-4 w-4" />

        </Button>

        <Button variant="ghost" size="sm" asChild title="Download">

          <a href={url} download target="_blank" rel="noopener noreferrer">

            <Download className="h-4 w-4" />

          </a>

        </Button>

      </div>

    </li>

  );

}



function PhotoPreview({ label, url }) {

  if (!url) return null;

  return (

    <div>

      <p className="mb-2 text-sm font-medium text-gray-700">{label}</p>

      <img src={url} alt={label} className="h-32 w-32 rounded-lg border object-cover" />

    </div>

  );

}



export default function EnrollmentUploadedFiles({ enrollment }) {

  const documents = enrollment?.documents || [];

  const hasPhoto = Boolean(enrollment?.photo_url);

  const hasFatherPhoto = Boolean(enrollment?.father_photo_url);

  const hasMotherPhoto = Boolean(enrollment?.mother_photo_url);

  const hasReceipt = Boolean(enrollment?.fee_receipt_url);

  const hasDocuments = documents.length > 0;

  const hasAny = hasPhoto || hasFatherPhoto || hasMotherPhoto || hasReceipt || hasDocuments;



  return (

    <Card>

      <CardHeader>

        <CardTitle>Uploaded Files</CardTitle>

      </CardHeader>

      <CardContent>

        {!hasAny ? (

          <p className="text-sm text-gray-500">No files uploaded with this application.</p>

        ) : (

          <ul className="space-y-2">

            <FileRow label="Student Photo" url={enrollment.photo_url} icon={ImageIcon} />

            <FileRow label="Father Photo" url={enrollment.father_photo_url} icon={ImageIcon} />

            <FileRow label="Mother Photo" url={enrollment.mother_photo_url} icon={ImageIcon} />

            <FileRow label="Registration Fee Receipt" url={enrollment.fee_receipt_url} />

            {documents.map((doc) => (

              <FileRow

                key={doc.id}

                label={doc.document_type_label || doc.document_type}

                url={doc.file_url}

              />

            ))}

          </ul>

        )}

        {(hasPhoto || hasFatherPhoto || hasMotherPhoto) && (

          <div className="mt-4 flex flex-wrap gap-6">

            <PhotoPreview label="Student Photo" url={enrollment.photo_url} />

            <PhotoPreview label="Father Photo" url={enrollment.father_photo_url} />

            <PhotoPreview label="Mother Photo" url={enrollment.mother_photo_url} />

          </div>

        )}

      </CardContent>

    </Card>

  );

}


